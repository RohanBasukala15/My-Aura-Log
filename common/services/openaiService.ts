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

export class OpenAIService {
    static async generateInsight(
        entryText: string,
        mood: MoodEmoji,
        tags?: string[]
    ): Promise<AIInsight> {
        const openai = getOpenAIClient();
        if (!openai) {
            // Return random mock data if API key is not set
            return generateRandomInsight(mood, tags);
        }

        const moodLabel = MOOD_LABELS[mood] || mood;
        const tagsText = tags && tags.length > 0 ? tags.join(", ") : "none";

        const prompt = `
You are My Aura Log, an empathetic AI assistant helping users understand their emotions.

Analyze the following journal entry with full context:

Mood: ${moodLabel} (${mood})
Tags: ${tagsText}
Thoughts: "${entryText}"

Consider the user's selected mood, the tags they've associated with this entry, and their written thoughts to provide a comprehensive and empathetic analysis. The mood reflects how they're feeling, the tags show what areas of life this relates to, and the thoughts contain the details of their experience.

Return JSON:
{
  "emotion": "Primary emotion (happy, sad, calm, anxious, angry, etc.)",
  "summary": "Brief compassionate summary that considers their mood, tags, and thoughts (max 35 words)",
  "suggestion": "Short positive advice tailored to their situation based on mood, tags, and content (max 45 words)",
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
            return generateRandomInsight(mood, tags);
        }
    }
}

