import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  type Unsubscribe,
  type DocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions, isFirebaseConfigured } from "./firebase";
import { getDeviceId } from "../utils/device-utils";
import { Storage } from "./Storage";
import type { CurrentAura, PartnerAura } from "@common/models/SoulLink";
import {
  SOUL_LINK_PARTNER_ID_KEY,
  SOUL_LINK_PARTNER_DISPLAY_NAME_KEY,
} from "@common/models/SoulLink";
import { getArchetypeForMood } from "@common/constants/soulLinkArchetypes";
import type { MoodEmoji } from "@common/models/JournalEntry";

const USERS_COLLECTION = "users";
const INCOMING_PULSES_SUBCOLLECTION = "incomingPulses";

/** Firestore user doc shape for Soul-Link (subset we read/write) */
type UserDocSoulLink = {
  soulLinkPartnerId?: string | null;
  currentAura?: {
    archetypeId: string;
    colorHex: string;
    oracleSnippet?: string | null;
    updatedAt: number;
  } | null;
  lastActiveAt?: number | null;
  /** Optional display name for this user (shown to partner) */
  soulLinkDisplayName?: string | null;
  updatedAt?: unknown;
};

const SOUL_LINK_CODE_LENGTH = 8;
const SOUL_LINK_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O, 1/I

function sanitize<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (v === undefined) delete out[k];
  }
  return out as T;
}

function generateLinkCode(): string {
  let code = "";
  for (let i = 0; i < SOUL_LINK_CODE_LENGTH; i++) {
    code += SOUL_LINK_CODE_CHARS.charAt(
      Math.floor(Math.random() * SOUL_LINK_CODE_CHARS.length)
    );
  }
  return code;
}

async function getUserRef() {
  if (!isFirebaseConfigured || !db) return null;
  const deviceId = await getDeviceId();
  return { ref: doc(db, USERS_COLLECTION, deviceId), deviceId } as const;
}

/**
 * Soul-Link service: link with a partner, sync current aura, real-time partner presence, and "Send Pulse" (haptic).
 * Uses Firestore for real-time sync and offline-first behavior.
 */
export const SoulLinkService = {
  /** Get linked partner's device id. Uses Storage first; if empty, syncs from Firestore (so when the other user linked, we see them). */
  async getPartnerId(): Promise<string | null> {
    const fromStorage = await Storage.getItem<string>(SOUL_LINK_PARTNER_ID_KEY, null);
    if (fromStorage) return fromStorage;
    const refData = await getUserRef();
    if (!refData) return null;
    const snap = await getDoc(refData.ref);
    const partnerId = snap.exists() ? (snap.data() as { soulLinkPartnerId?: string | null })?.soulLinkPartnerId : null;
    if (partnerId && typeof partnerId === "string") {
      await Storage.setItem(SOUL_LINK_PARTNER_ID_KEY, partnerId);
      return partnerId;
    }
    return null;
  },

  /**
   * Subscribe to the current user's soulLinkPartnerId in Firestore.
   * When the other user links with us, their app writes to our doc — this listener lets us see it immediately.
   * Updates Storage when partnerId changes so the rest of the app stays in sync.
   * Returns a Promise that resolves with an unsubscribe function (or null).
   */
  async subscribeToMyPartnerId(onUpdate: (partnerId: string | null) => void): Promise<Unsubscribe | null> {
    const refData = await getUserRef();
    if (!refData || !db) return null;
    return onSnapshot(refData.ref, (snap) => {
      const partnerId = snap.exists()
        ? (snap.data() as { soulLinkPartnerId?: string | null })?.soulLinkPartnerId
        : null;
      const id = partnerId && typeof partnerId === "string" ? partnerId : null;
      if (id) Storage.setItem(SOUL_LINK_PARTNER_ID_KEY, id).catch(() => {});
      else Storage.removeItem(SOUL_LINK_PARTNER_ID_KEY).catch(() => {});
      onUpdate(id);
    });
  },

  /** Get partner's display name from Storage (or null). */
  async getPartnerDisplayName(): Promise<string | null> {
    return Storage.getItem<string>(SOUL_LINK_PARTNER_DISPLAY_NAME_KEY, null);
  },

  /** Fetch partner's display name from Firestore (for when the other user linked and we never stored it). */
  async getPartnerDisplayNameFromFirestore(partnerDeviceId: string): Promise<string | null> {
    if (!isFirebaseConfigured || !db) return null;
    const snap = await getDoc(doc(db, USERS_COLLECTION, partnerDeviceId));
    const name = snap.exists() ? (snap.data() as { soulLinkDisplayName?: string | null })?.soulLinkDisplayName : null;
    return name && typeof name === "string" ? name : null;
  },

  /**
   * Link with a partner (two-way). Calls Cloud Function so both users get each other as partner.
   * Persists partner id and display name to local Storage after success.
   */
  async setPartner(partnerDeviceId: string, displayName?: string): Promise<boolean> {
    if (!isFirebaseConfigured || !functions) return false;
    const connect = httpsCallable<{ partnerDeviceId: string; partnerDisplayName?: string }, { ok: boolean }>(
      functions,
      "soulLinkConnect"
    );
    await connect({
      partnerDeviceId: partnerDeviceId.trim(),
      ...(displayName != null && displayName !== "" && { partnerDisplayName: displayName.trim() }),
    });
    await Storage.setItem(SOUL_LINK_PARTNER_ID_KEY, partnerDeviceId.trim());
    if (displayName != null) {
      await Storage.setItem(SOUL_LINK_PARTNER_DISPLAY_NAME_KEY, displayName);
    }
    return true;
  },

  /**
   * Get or create my Soul-Link code (shareable 8-char code so partner can link with me).
   * Stored on user doc as soulLinkCode; partner looks up by this code to get my deviceId.
   */
  async getMyLinkCode(): Promise<string> {
    const refData = await getUserRef();
    if (!refData) return "";
    const snap = await getDoc(refData.ref);
    const existing = snap.exists() ? (snap.data() as { soulLinkCode?: string })?.soulLinkCode : null;
    if (existing && typeof existing === "string" && existing.length >= 6) return existing;
    const code = generateLinkCode();
    await setDoc(
      refData.ref,
      sanitize({ soulLinkCode: code, updatedAt: serverTimestamp() }),
      { merge: true }
    );
    return code;
  },

  /**
   * Resolve partner's link code to their deviceId. Returns null if not found.
   */
  async resolveLinkCode(partnerCode: string): Promise<string | null> {
    if (!isFirebaseConfigured || !db) return null;
    const trimmed = partnerCode.trim().toUpperCase();
    if (trimmed.length < 6) return null;
    const q = query(
      collection(db, USERS_COLLECTION),
      where("soulLinkCode", "==", trimmed)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const partnerDoc = snap.docs[0];
    return partnerDoc.id;
  },

  /** Unlink (two-way): call Cloud Function to clear soulLinkPartnerId on both users, then clear local Storage. */
  async unlink(): Promise<boolean> {
    if (!isFirebaseConfigured || !functions) return false;
    const unlinkFn = httpsCallable<unknown, { ok: boolean }>(functions, "soulLinkUnlink");
    await unlinkFn({});
    await Storage.removeItem(SOUL_LINK_PARTNER_ID_KEY);
    await Storage.removeItem(SOUL_LINK_PARTNER_DISPLAY_NAME_KEY);
    return true;
  },

  /**
   * Set my display name (shown to my Soul-Link partner on their Orbital Presence).
   */
  async setMyDisplayName(displayName: string | null): Promise<boolean> {
    const refData = await getUserRef();
    if (!refData) return false;
    await setDoc(
      refData.ref,
      sanitize({
        soulLinkDisplayName: displayName ?? null,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
    return true;
  },

  /**
   * Sync current aura to Firestore from latest mood (and optional oracle snippet).
   * Call after saving a journal entry or when opening the app.
   */
  async setMyCurrentAura(
    mood: MoodEmoji,
    oracleSnippet?: string | null
  ): Promise<boolean> {
    const refData = await getUserRef();
    if (!refData) return false;
    const archetype = getArchetypeForMood(mood);
    const now = Date.now();
    await setDoc(
      refData.ref,
      sanitize({
        currentAura: {
          archetypeId: archetype.id,
          colorHex: archetype.colorHex,
          oracleSnippet: oracleSnippet ?? null,
          updatedAt: now,
        },
        lastActiveAt: now,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
    return true;
  },

  /**
   * Subscribe to partner's aura in real time (Orbital Presence halo, Sympathetic Glow).
   * Returns unsubscribe function.
   */
  subscribeToPartnerAura(
    partnerDeviceId: string,
    onUpdate: (aura: PartnerAura | null) => void
  ): Unsubscribe | null {
    if (!isFirebaseConfigured || !db) return null;
    const partnerRef = doc(db, USERS_COLLECTION, partnerDeviceId);
    return onSnapshot(
      partnerRef,
      (snap: DocumentSnapshot) => {
        const d = snap.data() as UserDocSoulLink | undefined;
        if (!d?.currentAura) {
          onUpdate(null);
          return;
        }
        const aura: PartnerAura = {
          archetypeId: d.currentAura.archetypeId as PartnerAura["archetypeId"],
          colorHex: d.currentAura.colorHex,
          oracleSnippet: d.currentAura.oracleSnippet ?? null,
          updatedAt: d.currentAura.updatedAt,
          displayName: d.soulLinkDisplayName ?? null,
          lastActiveAt: d.lastActiveAt ?? null,
        };
        onUpdate(aura);
      },
      () => onUpdate(null)
    );
  },

  /**
   * Mark presence (call when app comes to foreground / user opens Prism).
   * Updates lastActiveAt so partner's "Digital Co-Presence" can show both in-app.
   */
  async touchPresence(): Promise<boolean> {
    const refData = await getUserRef();
    if (!refData) return false;
    await setDoc(
      refData.ref,
      sanitize({ lastActiveAt: Date.now(), updatedAt: serverTimestamp() }),
      { merge: true }
    );
    return true;
  },

  /**
   * Send a "Pulse" to partner: they get haptic + optional flash.
   * Writes to partner's incomingPulses subcollection; partner's listener triggers haptic and deletes.
   */
  async sendPulseToPartner(partnerDeviceId: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;
    const deviceId = await getDeviceId();
    const partnerPulsesRef = collection(
      db,
      USERS_COLLECTION,
      partnerDeviceId,
      INCOMING_PULSES_SUBCOLLECTION
    );
    await addDoc(partnerPulsesRef, {
      fromUserId: deviceId,
      createdAt: serverTimestamp(),
    });
    return true;
  },

  /**
   * Subscribe to incoming pulses (for "Energy Nudges" / "The Echo").
   * On new pulse: run onPulse() then delete the pulse doc so it doesn't fire again.
   * Returns a Promise that resolves with an unsubscribe function (or null if not configured).
   */
  async subscribeToIncomingPulses(onPulse: () => void): Promise<Unsubscribe | null> {
    const refData = await getUserRef();
    if (!refData || !db) return null;
    const pulsesRef = collection(
      db,
      USERS_COLLECTION,
      refData.deviceId,
      INCOMING_PULSES_SUBCOLLECTION
    );

    const unsub = onSnapshot(
      pulsesRef,
      (snap: QuerySnapshot) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            onPulse();
            deleteDoc(change.doc.ref).catch(() => {});
          }
        });
      },
      () => {}
    );
    return unsub;
  },
};
