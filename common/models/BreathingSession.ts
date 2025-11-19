export interface BreathingSession {
    id: string;
    duration: number; // in seconds
    completedDuration: number; // in seconds
    startedAt: number; // timestamp
    completedAt?: number; // timestamp
    phaseTimings: {
        inhale: number; // seconds
        hold: number; // seconds
        exhale: number; // seconds
    };
    relatedJournalEntryId?: string; // ID of journal entry that triggered this session
    relatedMood?: string; // Mood emoji from journal entry
    relatedEmotion?: string; // Emotion from AI insight
}

export type BreathingPhase = "inhale" | "hold" | "exhale";

export const BREATHING_DURATIONS = [60, 180, 300]; // 1 min, 3 min, 5 min
export const BREATHING_DURATION_LABELS: Record<number, string> = {
    60: "1 min",
    180: "3 min",
    300: "5 min",
};

// Default breathing phase timings (seconds)
export const DEFAULT_PHASE_TIMINGS = {
    inhale: 4,
    hold: 4,
    exhale: 6,
};

export interface BreathingRecommendation {
    suggested: boolean;
    duration: number; // suggested duration in seconds
    reason: string; // reason for the recommendation
    journalEntryId?: string; // Optional: ID of journal entry that triggered recommendation
    mood?: string; // Optional: Mood emoji from journal entry
    emotion?: string; // Optional: Emotion from AI insight
}

