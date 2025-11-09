import OpenAI from "openai";
import { AIInsight } from "../models/JournalEntry";

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
    static async generateInsight(entryText: string): Promise<AIInsight> {
        const openai = getOpenAIClient();
        if (!openai) {
            // Return mock data if API key is not set
            return {
                emotion: "calm",
                summary: "A moment of reflection and awareness.",
                suggestion: "Take a deep breath and acknowledge your feelings.",
                quote: "Mindfulness is the path to inner peace.",
            };
        }

        const prompt = `
You are My Aura Log, an empathetic AI assistant helping users understand their emotions.

Analyze the following journal entry:

"${entryText}"

Return JSON:
{
  "emotion": "Primary emotion (happy, sad, calm, anxious, angry, etc.)",
  "summary": "Brief compassionate summary (max 20 words)",
  "suggestion": "Short positive advice (max 25 words)",
  "quote": "Uplifting quote or thought (max 15 words)"
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
            // Return fallback insight
            return {
                emotion: "calm",
                summary: "Your feelings are valid and acknowledged.",
                suggestion: "Take time to reflect and be gentle with yourself.",
                quote: "Every moment is a new beginning.",
            };
        }
    }
}

