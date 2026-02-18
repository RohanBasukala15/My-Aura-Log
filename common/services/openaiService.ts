import OpenAI from "openai";
import { AIInsight, MoodEmoji, MOOD_LABELS } from "../models/JournalEntry";
import { generateRandomInsight } from "./aiInsightMockData";

// Initialize OpenAI client only if API key is available
const getOpenAIClient = () => {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for React Native/Expo
    });
};

interface InsightContext {
    tags?: string[];
    emotions?: string[];
    sleep?: string[];
    healthActivities?: string[];
    hobbies?: string[];
    quickNote?: string;
}

/**
 * Formats context data for AI prompt
 */
const formatContextForPrompt = (context: InsightContext): string => {
    const sections: string[] = [];
    
    if (context.tags && context.tags.length > 0) {
        sections.push(`Tags: ${context.tags.join(", ")}`);
    }
    if (context.emotions && context.emotions.length > 0) {
        sections.push(`Emotions: ${context.emotions.join(", ")}`);
    }
    if (context.sleep && context.sleep.length > 0) {
        sections.push(`Sleep: ${context.sleep.join(", ")}`);
    }
    if (context.healthActivities && context.healthActivities.length > 0) {
        sections.push(`Health Activities: ${context.healthActivities.join(", ")}`);
    }
    if (context.hobbies && context.hobbies.length > 0) {
        sections.push(`Hobbies: ${context.hobbies.join(", ")}`);
    }
    if (context.quickNote && context.quickNote.trim()) {
        sections.push(`Additional Note: "${context.quickNote.trim()}"`);
    }
    
    return sections.length > 0 ? sections.join("\n") : "No additional context provided";
};

export class OpenAIService {
    static async generateInsight(
        entryText: string,
        mood: MoodEmoji,
        context?: InsightContext
    ): Promise<AIInsight> {
        const openai = getOpenAIClient();
        if (!openai) {
            // Return random mock data if API key is not set
            return generateRandomInsight(mood, context?.tags);
        }

        const moodLabel = MOOD_LABELS[mood] || mood;
        const contextText = context ? formatContextForPrompt(context) : "No additional context provided";

        const prompt = `
You are My Aura Log, an empathetic AI assistant helping users understand their emotions.

Analyze the following journal entry with full context:

Mood: ${moodLabel} (${mood})
Main Thoughts: "${entryText}"

Additional Context:
${contextText}

Consider the user's selected mood, their written thoughts, and all additional context (tags, emotions, sleep, health activities, hobbies, and any additional notes) to provide a comprehensive and empathetic analysis. The mood reflects how they're feeling, the thoughts contain the core details of their experience, and the additional context provides deeper insight into their daily activities, emotional state, and lifestyle choices.

Return JSON:
{
  "emotion": "Primary emotion (happy, sad, calm, anxious, angry, etc.)",
  "summary": "Brief compassionate summary that considers their mood, thoughts, and all context (max 35 words)",
  "suggestion": "Short positive advice tailored to their situation based on mood, thoughts, and all context (max 45 words)",
  "quote": "Uplifting quote or thought (max 25 words)"
}
`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are My Aura Log, an empathetic AI assistant. Always respond with valid JSON only, no markdown formatting.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 200,
            });

            const content = response.choices[0]?.message?.content || "{}";
            // Remove markdown code blocks if present
            const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

            const insight = JSON.parse(cleanedContent) as AIInsight;
            return insight;
        } catch (error) {
            // Return random fallback insight if API call fails
            return generateRandomInsight(mood, context?.tags);
        }
    }

    /**
     * Generate a short motivational quote for premium daily notifications.
     * Returns plain text, max ~15 words. Empty string on failure or no API key.
     */
    static async generateMotivationalQuote(): Promise<string> {
        const openai = getOpenAIClient();
        if (!openai) {
            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.warn("[OpenAI] Motivational quote skipped: EXPO_PUBLIC_OPENAI_API_KEY is not set (check .env and EAS secrets for production builds).");
            }
            return "";
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You respond with a single short motivational or uplifting quote. No preamble, no attribution, no extra punctuation. Plain text only. Maximum 15 words.",
                    },
                    { role: "user", content: "Give one short motivational quote." },
                ],
                temperature: 0.8,
                max_tokens: 60,
            });
            const text = response.choices[0]?.message?.content?.trim() || "";
            return text;
        } catch (err) {
            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.warn("[OpenAI] Motivational quote failed:", err instanceof Error ? err.message : err);
            }
            return "";
        }
    }

    /**
     * Generate a motivational quote about journaling, mental health, or mindfulness
     * for empty-state screens (e.g. history). Returns quote and optional author.
     */
    static async generateJournalingMotivationalQuote(): Promise<{ quote: string; author?: string }> {
        const openai = getOpenAIClient();
        if (!openai) {
            return {
                quote: "Writing your thoughts is one of the kindest things you can do for your mind.",
                author: "My Aura Log",
            };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You respond with valid JSON only. No markdown, no code blocks. Format: {\"quote\": \"the quote text\", \"author\": \"Author Name\"}. The quote must be about journaling, mental health, mindfulness, self-reflection, or writing for wellbeing. Use a real or plausible attributed author when it fits (e.g. famous writers, thinkers, psychologists). Keep quote under 25 words, warm and motivating.",
                    },
                    {
                        role: "user",
                        content:
                            "Give one short, captivating motivational quote about journaling or mental wellness, with an author. Return only the JSON object.",
                    },
                ],
                temperature: 0.8,
                max_tokens: 120,
            });
            const raw = response.choices[0]?.message?.content?.trim() || "";
            const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned) as { quote?: string; author?: string };
            const quote = typeof parsed?.quote === "string" && parsed.quote.length > 0
                ? parsed.quote
                : "Writing your thoughts is one of the kindest things you can do for your mind.";
            const author = typeof parsed?.author === "string" && parsed.author.length > 0
                ? parsed.author
                : undefined;
            return { quote, author };
        } catch (err) {
            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.warn("[OpenAI] Journaling quote failed:", err instanceof Error ? err.message : err);
            }
            return {
                quote: "Start journaling to see your entries here—and give your mind a little room to breathe.",
                author: "My Aura Log",
            };
        }
    }
}

