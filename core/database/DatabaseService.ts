import * as SQLite from 'expo-sqlite';
import { TravelDocument } from '../types/Document';
import { Trip } from '../types/Trip';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  public static async init(): Promise<void> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('smart_travel.db');
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY NOT NULL,
          data TEXT NOT NULL,
          is_active INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY NOT NULL,
          trip_id TEXT NOT NULL,
          category TEXT NOT NULL,
          data TEXT NOT NULL
        );
      `);
    }
  }

  public static async saveTrip(trip: Trip): Promise<void> {
    await this.init();
    await this.db?.runAsync(
      'INSERT OR REPLACE INTO trips (id, data, is_active) VALUES (?, ?, ?)',
      [trip.id, JSON.stringify(trip), trip.isActive ? 1 : 0]
    );
  }

  public static async saveDocument(doc: TravelDocument): Promise<void> {
    await this.init();
    await this.db?.runAsync(
      'INSERT OR REPLACE INTO documents (id, trip_id, category, data) VALUES (?, ?, ?, ?)',
      [doc.id, doc.tripId, doc.category, JSON.stringify(doc)]
    );
  }
}
