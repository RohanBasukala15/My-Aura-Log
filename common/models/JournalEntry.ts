export interface JournalEntry {
    id: string;
    mood: MoodEmoji;
    text: string;
    tags?: string[];
    emotions?: string[];
    sleep?: string[];
    healthActivities?: string[];
    hobbies?: string[];
    quickNote?: string;
    aiInsight?: AIInsight;
    timestamp: number;
    createdAt: string;
}

export type MoodEmoji = "😊" | "😟" | "😠" | "😴" | "😑";

export interface AIInsight {
    emotion: string;
    summary: string;
    suggestion: string;
    quote: string;
}

export const MOOD_EMOJIS: MoodEmoji[] = ["😊", "😟", "😠", "😴", "😑"];

export const MOOD_LABELS: Record<MoodEmoji, string> = {
    "😊": "Happy",
    "😟": "Worried",
    "😠": "Angry",
    "😴": "Tired",
    "😑": "Neutral",
};

export const MOOD_VALUES: Record<MoodEmoji, number> = {
    "😊": 5,
    "😟": 2,
    "😠": 1,
    "😴": 2,
    "😑": 3,
};

