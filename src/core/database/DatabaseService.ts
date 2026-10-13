import * as SQLite from 'expo-sqlite';
import { TravelDocument } from '../types/Document';
import { Trip } from '../types/Trip';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly VAULT_KEY = 'SmartTravelVault_Encrypted_Offline_Key_2026';

  /**
   * הצפנה סימטרית מקומית להגנה על המידע הרגיש במסד הנתונים (Encryption at Rest)
   */
  private static encrypt(plainText: string): string {
    const encoded = encodeURIComponent(plainText);
    const codes: number[] = [];
    for (let i = 0; i < encoded.length; i++) {
      codes.push(encoded.charCodeAt(i) ^ this.VAULT_KEY.charCodeAt(i % this.VAULT_KEY.length));
    }
    return `enc_v1:${codes.join('.')}`;
  }

  /**
   * פענוח הנתונים המקומיים
   */
  private static decrypt(cipherText: string): string {
    if (!cipherText.startsWith('enc_v1:')) return cipherText;
    const parts = cipherText.substring(7).split('.');
    let decoded = '';
    for (let i = 0; i < parts.length; i++) {
      const code = parseInt(parts[i], 10);
      decoded += String.fromCharCode(code ^ this.VAULT_KEY.charCodeAt(i % this.VAULT_KEY.length));
    }
    return decodeURIComponent(decoded);
  }

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
    const encryptedData = this.encrypt(JSON.stringify(trip));
    await this.db?.runAsync(
      'INSERT OR REPLACE INTO trips (id, data, is_active) VALUES (?, ?, ?)',
      [trip.id, encryptedData, trip.isActive ? 1 : 0]
    );
  }

  public static async getActiveTrip(): Promise<Trip | null> {
    await this.init();
    const result = await this.db?.getFirstAsync<{ data: string }>(
      'SELECT data FROM trips WHERE is_active = 1 LIMIT 1'
    );
    if (!result) return null;
    const decrypted = this.decrypt(result.data);
    return JSON.parse(decrypted) as Trip;
  }

  public static async getAllTrips(): Promise<Trip[]> {
    await this.init();
    const rows = await this.db?.getAllAsync<{ data: string }>(
      'SELECT data FROM trips ORDER BY id DESC'
    );
    if (!rows) return [];
    return rows.map(r => JSON.parse(this.decrypt(r.data)) as Trip);
  }

  public static async deleteTrip(id: string): Promise<void> {
    await this.init();
    await this.db?.runAsync('DELETE FROM documents WHERE trip_id = ?', [id]);
    await this.db?.runAsync('DELETE FROM trips WHERE id = ?', [id]);
  }

  public static async saveDocument(doc: TravelDocument): Promise<void> {
    await this.init();
    const encryptedData = this.encrypt(JSON.stringify(doc));
    await this.db?.runAsync(
      'INSERT OR REPLACE INTO documents (id, trip_id, category, data) VALUES (?, ?, ?, ?)',
      [doc.id, doc.tripId, doc.category, encryptedData]
    );
  }

  public static async getDocumentsByTrip(tripId: string): Promise<TravelDocument[]> {
    await this.init();
    const rows = await this.db?.getAllAsync<{ data: string }>(
      'SELECT data FROM documents WHERE trip_id = ?',
      [tripId]
    );
    if (!rows) return [];
    return rows.map(r => JSON.parse(this.decrypt(r.data)) as TravelDocument);
  }

  public static async getDocumentById(id: string): Promise<TravelDocument | null> {
    await this.init();
    const result = await this.db?.getFirstAsync<{ data: string }>(
      'SELECT data FROM documents WHERE id = ? LIMIT 1',
      [id]
    );
    if (!result) return null;
    return JSON.parse(this.decrypt(result.data)) as TravelDocument;
  }

  public static async deleteDocument(id: string): Promise<void> {
    await this.init();
    await this.db?.runAsync('DELETE FROM documents WHERE id = ?', [id]);
  }
}
