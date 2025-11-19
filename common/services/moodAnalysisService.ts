import { JournalEntry, MoodEmoji, MOOD_VALUES } from "../models/JournalEntry";
import { BreathingRecommendation } from "../models/BreathingSession";

// Keywords that indicate stress, anxiety, or negative emotions
const STRESS_KEYWORDS = [
    "stressed", "stress", "anxious", "anxiety", "worried", "worry",
    "overwhelmed", "pressure", "nervous", "tense", "panic", "frustrated",
    "frustration", "angry", "anger", "irritated", "annoyed", "upset",
    "sad", "depressed", "down", "exhausted", "tired", "burned out",
    "burnout", "hectic", "chaos", "difficult", "hard", "struggle",
    "struggling", "problem", "problems", "issue", "issues", "concern",
    "concerned", "fear", "afraid", "scared", "terrified", "dread",
    "hate", "hated", "disappointed", "disappointment", "hurt"
];

const CALM_KEYWORDS = [
    "calm", "peaceful", "relaxed", "content", "happy", "joyful",
    "grateful", "thankful", "blessed", "at ease", "comfortable",
    "satisfied", "fulfilled", "peace", "tranquil", "serene"
];

/**
 * Analyzes journal entry text and mood to determine if breathing exercise is recommended
 */
export class MoodAnalysisService {
    /**
     * Analyze a journal entry to determine if a breathing exercise should be recommended
     */
    static analyzeEntry(entry: JournalEntry): BreathingRecommendation {
        const text = entry.text.toLowerCase();
        const mood = entry.mood;
        const moodValue = MOOD_VALUES[mood];

        // Count stress keywords
        const stressCount = STRESS_KEYWORDS.reduce((count, keyword) => {
            return count + (text.includes(keyword) ? 1 : 0);
        }, 0);

        // Count calm keywords
        const calmCount = CALM_KEYWORDS.reduce((count, keyword) => {
            return count + (text.includes(keyword) ? 1 : 0);
        }, 0);

        // Determine stress level (0-10 scale)
        let stressLevel = 0;

        // Base stress from mood (lower mood value = higher stress)
        if (moodValue <= 2) {
            stressLevel += 6; // High stress mood (angry, sad, tired)
        } else if (moodValue === 3) {
            stressLevel += 3; // Neutral mood
        }

        // Adjust based on keywords
        stressLevel += Math.min(stressCount * 0.5, 3); // Max 3 points from keywords
        stressLevel -= Math.min(calmCount * 0.3, 2); // Max -2 points from calm keywords
        stressLevel = Math.max(0, Math.min(10, stressLevel)); // Clamp between 0-10

        // Determine recommendation
        const shouldRecommend = stressLevel >= 4; // Recommend if stress level >= 4

        if (!shouldRecommend) {
            return {
                suggested: false,
                duration: 0,
                reason: "",
            };
        }

        // Determine duration based on stress level
        let duration: number;
        let reason: string;

        if (stressLevel >= 8) {
            duration = 300; // 5 minutes for high stress
            reason = "We noticed you might be experiencing high stress or anxiety. A 5-minute breathing exercise can help you find calm.";
        } else if (stressLevel >= 6) {
            duration = 180; // 3 minutes for moderate-high stress
            reason = "You seem to be feeling stressed or overwhelmed. A 3-minute breathing session can help you center yourself.";
        } else {
            duration = 60; // 1 minute for moderate stress
            reason = "Take a moment to breathe. A quick 1-minute breathing exercise can help you feel more balanced.";
        }

        return {
            suggested: true,
            duration,
            reason,
            journalEntryId: entry.id,
            mood: entry.mood,
            emotion: entry.aiInsight?.emotion,
        };
    }

    /**
     * Analyze mood emoji alone for a quick recommendation
     */
    static analyzeMood(mood: MoodEmoji): BreathingRecommendation {
        const moodValue = MOOD_VALUES[mood];

        // Recommend for negative moods
        if (moodValue <= 2) {
            const duration = moodValue === 1 ? 300 : 180; // 5 min for sad, 3 min for angry/tired
            return {
                suggested: true,
                duration,
                reason: `Based on your mood, a ${duration === 300 ? "5-minute" : "3-minute"} breathing exercise might help you feel more centered.`,
                mood: mood,
            };
        }

        return {
            suggested: false,
            duration: 0,
            reason: "",
        };
    }
}

