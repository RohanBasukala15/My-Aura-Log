import { Storage } from "./Storage";
import { BreathingSession } from "../models/BreathingSession";

const STORAGE_KEY = "myauralog_breathing_sessions";

export class BreathingStorage {
    static async getAllSessions(): Promise<BreathingSession[]> {
        const sessions = await Storage.getItem<BreathingSession[]>(STORAGE_KEY, []);
        return sessions || [];
    }

    static async getSession(id: string): Promise<BreathingSession | null> {
        const sessions = await this.getAllSessions();
        return sessions.find((session) => session.id === id) || null;
    }

    static async saveSession(session: BreathingSession): Promise<void> {
        const sessions = await this.getAllSessions();
        const existingIndex = sessions.findIndex((s) => s.id === session.id);

        if (existingIndex >= 0) {
            sessions[existingIndex] = session;
        } else {
            sessions.unshift(session); // Add new sessions at the beginning
        }

        await Storage.setItem(STORAGE_KEY, sessions);
    }

    static async deleteSession(id: string): Promise<void> {
        const sessions = await this.getAllSessions();
        const filtered = sessions.filter((s) => s.id !== id);
        await Storage.setItem(STORAGE_KEY, filtered);
    }

    static async clearAllSessions(): Promise<void> {
        await Storage.removeItem(STORAGE_KEY);
    }

    static async getSessionsByDateRange(startDate: number, endDate: number): Promise<BreathingSession[]> {
        const sessions = await this.getAllSessions();
        return sessions.filter(
            (session) => session.startedAt >= startDate && session.startedAt <= endDate
        );
    }

    static async getTodaySessions(): Promise<BreathingSession[]> {
        const now = Date.now();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        return this.getSessionsByDateRange(startOfDay.getTime(), now);
    }
}

