import { Storage } from "./Storage";
import { JournalEntry } from "../models/JournalEntry";

const STORAGE_KEY = "myauralog_journal_entries";

export class JournalStorage {
    static async getAllEntries(): Promise<JournalEntry[]> {
        const entries = await Storage.getItem<JournalEntry[]>(STORAGE_KEY, []);
        return entries || [];
    }

    static async getEntry(id: string): Promise<JournalEntry | null> {
        const entries = await this.getAllEntries();
        return entries.find((entry) => entry.id === id) || null;
    }

    static async saveEntry(entry: JournalEntry): Promise<void> {
        const entries = await this.getAllEntries();
        const existingIndex = entries.findIndex((e) => e.id === entry.id);

        if (existingIndex >= 0) {
            entries[existingIndex] = entry;
        } else {
            entries.unshift(entry); // Add new entries at the beginning
        }

        await Storage.setItem(STORAGE_KEY, entries);
    }

    static async deleteEntry(id: string): Promise<void> {
        const entries = await this.getAllEntries();
        const filtered = entries.filter((e) => e.id !== id);
        await Storage.setItem(STORAGE_KEY, filtered);
    }

    static async clearAllEntries(): Promise<void> {
        await Storage.removeItem(STORAGE_KEY);
    }

    static async getEntriesByDateRange(startDate: number, endDate: number): Promise<JournalEntry[]> {
        const entries = await this.getAllEntries();
        return entries.filter(
            (entry) => entry.timestamp >= startDate && entry.timestamp <= endDate
        );
    }
}

