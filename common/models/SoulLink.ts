import type { ArchetypeId } from "@common/constants/soulLinkArchetypes";

/** Current aura synced to Firestore for Orbital Presence & Sympathetic Glow */
export interface CurrentAura {
  archetypeId: ArchetypeId;
  colorHex: string;
  /** Optional one-line from today's Oracle / AI insight */
  oracleSnippet?: string | null;
  updatedAt: number;
}

/** Partner's live aura + presence (from Firestore listener) */
export interface PartnerAura extends CurrentAura {
  /** Display name if partner set one */
  displayName?: string | null;
  /** Mindfulness avatar URL (shown in PIP orb when they connect) */
  avatarUrl?: string | null;
  /** Last time partner was in-app (for "Digital Co-Presence" / halo pulse) */
  lastActiveAt?: number | null;
}

/** Stored on user doc: who they're linked to (deviceId) */
export const SOUL_LINK_PARTNER_ID_KEY = "soulLinkPartnerId";

/** Local display name for the linked partner (e.g. "Sarah") */
export const SOUL_LINK_PARTNER_DISPLAY_NAME_KEY = "soulLinkPartnerDisplayName";
