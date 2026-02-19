/**
 * Shared avatar config for Onboarding (5 starters) and Settings Edit Profile (5 + 15 premium).
 * DiceBear Avataaars: https://api.dicebear.com/9.x/avataaars
 */

export const DICEBEAR_AVATAARS_BASE = "https://api.dicebear.com/9.x/avataaars/png";

export const STARTER_AVATAR_COUNT = 5;
export const PREMIUM_AVATAR_COUNT = 15;

export const STARTER_SEEDS = ["Luna", "River", "Sky", "Sage", "Ember"];

export const PREMIUM_SEEDS = [
  "Ivy",
  "Jade",
  "Phoenix",
  "Orion",
  "Willow",
  "Aurora",
  "Cedar",
  "Meadow",
  "Storm",
  "Blaze",
  "Haven",
  "Flora",
  "Echo",
  "Nova",
  "Zen",
];

export const ALL_AVATAR_SEEDS = [...STARTER_SEEDS, ...PREMIUM_SEEDS];

export const SOUL_LINK_AVATAR_SEED_KEY = "soulLinkAvatarSeed";

export function getAvatarUri(seed: string, size: number = 64): string {
  return `${DICEBEAR_AVATAARS_BASE}?seed=${encodeURIComponent(seed)}&size=${size}`;
}
