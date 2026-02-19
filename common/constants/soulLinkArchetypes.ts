import type { MoodEmoji } from "@common/models/JournalEntry";

/**
 * Soul-Link: map app mood to a poetic "frequency" / archetype for passive, shared presence.
 * Used for Orbital Presence halo, Sympathetic Glow, Shared Guidance, and Chroma-Sync.
 */
export type ArchetypeId =
  | "phoenix"   // high energy, warm
  | "oasis"     // calm, grounded
  | "glacier"   // cool, still
  | "storm"     // intense, turbulent
  | "ember";    // low, resting

export interface Archetype {
  id: ArchetypeId;
  name: string;
  /** Hex for halo, particles, and UI glow */
  colorHex: string;
  /** Short label for "Sarah is currently a Glacier" */
  label: string;
}

export const MOOD_TO_ARCHETYPE: Record<MoodEmoji, Archetype> = {
  "😊": { id: "phoenix", name: "Phoenix", colorHex: "#E87C2C", label: "Phoenix" },
  "😟": { id: "storm", name: "Storm", colorHex: "#6B5B95", label: "Storm" },
  "😠": { id: "storm", name: "Storm", colorHex: "#8B3A3A", label: "Storm" },
  "😴": { id: "ember", name: "Ember", colorHex: "#C4A77D", label: "Ember" },
  "😑": { id: "glacier", name: "Glacier", colorHex: "#5B8FB9", label: "Glacier" },
};

/** All archetypes for Shared Guidance / Oracle for Two */
export const ARCHETYPES: Archetype[] = [
  { id: "phoenix", name: "Phoenix", colorHex: "#E87C2C", label: "Phoenix" },
  { id: "oasis", name: "Oasis", colorHex: "#4A9B6E", label: "Oasis" },
  { id: "glacier", name: "Glacier", colorHex: "#5B8FB9", label: "Glacier" },
  { id: "storm", name: "Storm", colorHex: "#6B5B95", label: "Storm" },
  { id: "ember", name: "Ember", colorHex: "#C4A77D", label: "Ember" },
];

export function getArchetypeForMood(mood: MoodEmoji): Archetype {
  return MOOD_TO_ARCHETYPE[mood];
}

export function getArchetypeById(id: ArchetypeId): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}
