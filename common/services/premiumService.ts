import { Storage } from "./Storage";

const PREMIUM_STATUS_KEY = "myauralog_premium_status";
const DAILY_AI_USAGE_KEY = "myauralog_daily_ai_usage";
const FREE_AI_LIMIT_PER_DAY = 5;

interface DailyUsage {
    date: string; // YYYY-MM-DD format
    count: number;
}

export class PremiumService {
    /**
     * Check if user has premium status
     */
    static async isPremium(): Promise<boolean> {
        const premiumStatus = await Storage.getItem<boolean>(PREMIUM_STATUS_KEY, false);
        return premiumStatus || false;
    }

    /**
     * Set premium status (after successful payment)
     */
    static async setPremiumStatus(isPremium: boolean): Promise<void> {
        await Storage.setItem(PREMIUM_STATUS_KEY, isPremium);
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    private static getTodayDateString(): string {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    /**
     * Get today's AI usage count
     */
    static async getTodayAIUsage(): Promise<number> {
        const today = this.getTodayDateString();
        const usage = await Storage.getItem<DailyUsage>(DAILY_AI_USAGE_KEY, { date: today, count: 0 });

        // If usage is from a different day, reset it
        if (usage?.date !== today) {
            await Storage.setItem(DAILY_AI_USAGE_KEY, { date: today, count: 0 });
            return 0;
        }

        return usage?.count || 0;
    }

    /**
     * Check if user can use AI analysis (has premium or hasn't exceeded daily limit)
     */
    static async canUseAI(): Promise<boolean> {
        const isPremium = await this.isPremium();
        if (isPremium) {
            return true; // Premium users have unlimited access
        }

        const todayUsage = await this.getTodayAIUsage();
        return todayUsage < FREE_AI_LIMIT_PER_DAY;
    }

    /**
     * Get remaining AI analyses for today
     */
    static async getRemainingAIUsage(): Promise<number> {
        const isPremium = await this.isPremium();
        if (isPremium) {
            return -1; // -1 means unlimited
        }

        const todayUsage = await this.getTodayAIUsage();
        return Math.max(0, FREE_AI_LIMIT_PER_DAY - todayUsage);
    }

    /**
     * Increment AI usage count (call this after generating AI insight)
     */
    static async incrementAIUsage(): Promise<void> {
        const isPremium = await this.isPremium();
        if (isPremium) {
            return; // Don't track usage for premium users
        }

        const today = this.getTodayDateString();
        const usage = await Storage.getItem<DailyUsage>(DAILY_AI_USAGE_KEY, { date: today, count: 0 });

        // Reset if it's a new day
        if (usage?.date !== today) {
            await Storage.setItem(DAILY_AI_USAGE_KEY, { date: today, count: 1 });
        } else {
            await Storage.setItem(DAILY_AI_USAGE_KEY, { date: today, count: (usage?.count || 0) + 1 });
        }
    }

    /**
     * Reset daily usage (for testing or admin purposes)
     */
    static async resetDailyUsage(): Promise<void> {
        await Storage.removeItem(DAILY_AI_USAGE_KEY);
    }
}

