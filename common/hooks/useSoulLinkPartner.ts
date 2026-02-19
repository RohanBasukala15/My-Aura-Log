import { useState, useEffect, useCallback } from "react";
import type { Unsubscribe } from "firebase/firestore";
import * as Haptics from "expo-haptics";
import { SoulLinkService } from "@common/services/soulLinkService";
import type { PartnerAura } from "@common/models/SoulLink";

const PRESENCE_THRESHOLD_MS = 2 * 60 * 1000; // 2 min = "recently active" for halo pulse

const noop = () => {};

export function useSoulLinkPartner() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerDisplayName, setPartnerDisplayName] = useState<string | null>(null);
  const [partnerAura, setPartnerAura] = useState<PartnerAura | null>(null);
  const [isPartnerPresent, setIsPartnerPresent] = useState(false);

  // Real-time subscription to my user doc: when the other user links with us, we see soulLinkPartnerId immediately
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    SoulLinkService.subscribeToMyPartnerId((id) => {
      if (mounted) setPartnerId(id);
    }).then((u) => {
      if (mounted && u) unsub = u;
    });
    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  // Partner display name: from Storage, and when we get a new partnerId fetch from Firestore if missing
  useEffect(() => {
    let mounted = true;
    SoulLinkService.getPartnerDisplayName().then((name) => {
      if (mounted) setPartnerDisplayName(name);
    });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!partnerId) {
      setPartnerDisplayName(null);
      return;
    }
    let mounted = true;
    SoulLinkService.getPartnerDisplayNameFromFirestore(partnerId).then((name) => {
      if (mounted && name) setPartnerDisplayName(name);
    });
    return () => {
      mounted = false;
    };
  }, [partnerId]);

  // Real-time partner aura subscription
  useEffect(() => {
    if (!partnerId) {
      setPartnerAura(null);
      setIsPartnerPresent(false);
      return undefined;
    }
    const unsub = SoulLinkService.subscribeToPartnerAura(partnerId, (aura) => {
      setPartnerAura(aura);
      const lastActive = aura?.lastActiveAt;
      setIsPartnerPresent(
        !!lastActive && Date.now() - lastActive < PRESENCE_THRESHOLD_MS
      );
    });
    return () => unsub?.();
  }, [partnerId]);

  // Incoming pulses → haptic "heartbeat"
  useEffect(() => {
    let unsub: Unsubscribe | null = null;
    let mounted = true;
    SoulLinkService.subscribeToIncomingPulses(() => {
      // Rhythmic haptic: two light impacts for "heartbeat"
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(noop);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(noop);
      }, 120);
    }).then((u) => {
      if (mounted) unsub = u;
    });
    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  const sendPulse = useCallback(async () => {
    if (!partnerId) return false;
    return SoulLinkService.sendPulseToPartner(partnerId);
  }, [partnerId]);

  const touchPresence = useCallback(() => {
    SoulLinkService.touchPresence();
  }, []);

  return {
    partnerId,
    partnerDisplayName,
    partnerAura,
    isPartnerPresent,
    isLinked: !!partnerId,
    sendPulse,
    touchPresence,
  };
}
