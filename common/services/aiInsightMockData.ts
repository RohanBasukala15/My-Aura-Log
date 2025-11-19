import { AIInsight } from "../models/JournalEntry";

/**
 * Mock data for AI insights when OpenAI API is not available.
 * These are randomly selected to provide variety in offline mode.
 */

export const MOCK_EMOTIONS = [
    "calm",
    "grateful",
    "reflective",
    "hopeful",
    "content",
    "peaceful",
    "mindful",
    "appreciative",
    "serene",
    "balanced",
    "optimistic",
    "grounded",
    "centered",
    "thankful",
    "at ease",
    "thoughtful",
    "present",
    "accepting",
    "gentle",
    "compassionate",
];

export const MOCK_SUMMARIES = [
    "A moment of reflection and awareness. Your thoughts show depth and self-awareness.",
    "You're taking time to process your experiences, which is a sign of emotional intelligence.",
    "Your words reflect a thoughtful approach to understanding your feelings and experiences.",
    "This entry shows you're actively engaging with your emotions and seeking clarity.",
    "A beautiful moment of self-reflection. You're honoring your feelings with presence.",
    "Your thoughts demonstrate mindfulness and a willingness to explore your inner world.",
    "You're creating space for self-understanding, which is a powerful practice.",
    "This reflection shows you're connecting with yourself in a meaningful way.",
    "Your words carry the weight of genuine self-exploration and emotional honesty.",
    "A thoughtful pause in your day to acknowledge and process your experiences.",
    "You're showing courage in examining your feelings and thoughts with openness.",
    "This entry reflects a moment of clarity and self-compassion in your journey.",
    "Your reflection demonstrates awareness and a gentle approach to self-discovery.",
    "A meaningful pause to honor your experiences and emotions with presence.",
    "You're cultivating self-awareness through this thoughtful reflection on your day.",
    "Your words show you're creating space for understanding and growth.",
    "This moment of reflection is a gift you're giving yourself for deeper insight.",
    "You're engaging with your inner world with curiosity and compassion.",
    "A beautiful expression of self-awareness and emotional intelligence.",
    "Your reflection shows you're present with your experiences and feelings.",
];

export const MOCK_SUGGESTIONS = [
    "Take a deep breath and acknowledge your feelings. They are valid and important.",
    "Consider spending a few moments in quiet reflection or gentle movement today.",
    "Remember to be kind to yourself. Self-compassion is a powerful practice.",
    "You might find it helpful to connect with nature or do something that brings you joy.",
    "Try to stay present with your feelings without judgment. They are messengers.",
    "Consider writing down three things you're grateful for today.",
    "Take time for yourself today. Self-care is not selfish—it's essential.",
    "You might benefit from a short walk or some gentle stretching to ground yourself.",
    "Remember that feelings are temporary. Allow them to flow through you.",
    "Consider reaching out to someone you trust if you need support or connection.",
    "Try a breathing exercise or meditation to help center yourself today.",
    "Be gentle with yourself. You're doing the best you can in this moment.",
    "Consider what you need right now and honor that need with compassion.",
    "You might find it helpful to engage in a creative activity or hobby you enjoy.",
    "Remember that self-reflection is a strength. You're growing through awareness.",
    "Take a moment to appreciate the courage it takes to examine your feelings.",
    "Consider setting aside time for rest or activities that nourish your soul.",
    "You're on a journey of self-discovery. Trust the process and be patient.",
    "Try to find balance today between reflection and action, rest and activity.",
    "Remember that every moment is an opportunity for growth and understanding.",
];

export const MOCK_QUOTES = [
    "Mindfulness is the path to inner peace.",
    "Every moment is a new beginning.",
    "Your feelings are valid and acknowledged.",
    "Self-awareness is the first step toward growth.",
    "Be gentle with yourself—you're doing your best.",
    "The present moment is where life happens.",
    "Self-compassion is a gift you give yourself.",
    "Growth happens one moment at a time.",
    "Your journey is unique and valuable.",
    "Peace comes from within—don't seek it without.",
    "Embrace your feelings—they are your teachers.",
    "You are exactly where you need to be.",
    "Self-reflection is a form of self-care.",
    "Trust the process of your own growth.",
    "Every feeling is a messenger with wisdom.",
    "Be present with what is, without judgment.",
    "Your inner wisdom is always available to you.",
    "Compassion for yourself opens doors to healing.",
    "The journey inward is the most important one.",
    "You have everything you need within you.",
];

/**
 * Generates a random AI insight from mock data
 * @param mood - Optional mood to influence the selection (for future mood-based filtering)
 * @param tags - Optional tags to influence the selection (for future tag-based filtering)
 */
export function generateRandomInsight(mood?: string, tags?: string[]): AIInsight {
    const randomEmotion = MOCK_EMOTIONS[Math.floor(Math.random() * MOCK_EMOTIONS.length)];
    const randomSummary = MOCK_SUMMARIES[Math.floor(Math.random() * MOCK_SUMMARIES.length)];
    const randomSuggestion = MOCK_SUGGESTIONS[Math.floor(Math.random() * MOCK_SUGGESTIONS.length)];
    const randomQuote = MOCK_QUOTES[Math.floor(Math.random() * MOCK_QUOTES.length)];

    return {
        emotion: randomEmotion,
        summary: randomSummary,
        suggestion: randomSuggestion,
        quote: randomQuote,
    };
}

