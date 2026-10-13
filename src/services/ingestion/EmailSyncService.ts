/**
 * @file EmailSyncService.ts
 * @description
 * שירות סנכרון המייל של האפליקציה (Email Ingestion).
 * מתחבר לחשבון המייל של המשתמש (למשל Gmail דרך OAuth), ומחפש הודעות
 * שמכילות קבצי טיסה, מלון או ביטוח מצורפים (PDF/תמונות).
 * השירות מבצע חיפוש חכם באמצעות מילות מפתח מוגדרות מראש,
 * ומוריד את הקבצים המצורפים לאחסון המקומי כדי שהאפליקציה תפענח אותם.
 */

import { AppConfig } from '../../core/constants/AppConfig';
import { CATEGORY_KEYWORDS } from '../../core/constants/Keywords';
import { TripAnchor } from '../../core/types/Trip';

export interface EmailAttachment {
  fileName: string;
  mimeType: string;
  dataBase64: string; // נתוני הקובץ כדי שנוכל לשמור אותו מקומית בטלפון
}

export class EmailSyncService {
  // יש למלא כאן Client ID של גוגל עבור אימות Gmail OAuth 2.0
  private static readonly GOOGLE_CLIENT_ID: string = '';

  // יש למלא כאן מפתח API של Google במידת הצורך
  private static readonly GOOGLE_API_KEY: string = '';

  /**
   * הפונקציה המרכזית לסנכרון מיילים רלוונטיים לנסיעה.
   * @param accessToken טוקן גישה מאובטח (OAuth) של המשתמש
   * @param anchor עוגן הטיול כדי לדעת ממתי להתחיל לחפש מיילים
   * @returns רשימה של קבצים מצורפים שחולצו מהמיילים
   */
  public static async syncTravelEmails(accessToken: string, anchor: TripAnchor): Promise<EmailAttachment[]> {
    try {
      console.log("[EmailSyncService] מתחיל סנכרון מיילים חכם...");

      // 1. בניית שאילתת החיפוש (בפורמט של Gmail API)
      const searchQuery = this.buildSearchQuery(anchor.scanWindowStartDate);
      console.log(`[EmailSyncService] שאילתת חיפוש: ${searchQuery}`);

      // 2. קריאה ל-API של ספק המייל (Gmail API)
      const relevantMessageIds = await this.fetchMessageIds(accessToken, searchQuery);

      const attachments: EmailAttachment[] = [];

      // 3. מעבר על ההודעות הרלוונטיות ושאיבת הקבצים המצורפים
      for (const messageId of relevantMessageIds) {
        const messageAttachments = await this.extractAttachments(accessToken, messageId);
        attachments.push(...messageAttachments);
      }

      console.log(`[EmailSyncService] חולצו ${attachments.length} קבצים ממיילים.`);
      return attachments;

    } catch (error) {
      console.error("[EmailSyncService] שגיאה בסנכרון המייל:", error);
      return [];
    }
  }

  /**
   * בונה את שאילתת החיפוש למייל המבוססת על מילות המפתח ועוגן התאריכים
   * דוגמה לתוצאה: "has:attachment (boarding OR ticket OR hotel OR insurance) after:2025/08/30"
   */
  private static buildSearchQuery(scanStartDate: string): string {
    const dateQuery = new Date(scanStartDate).toISOString().split('T')[0]; // פורמט YYYY-MM-DD

    // ניקח מדגם של מילות מפתח באנגלית שעסקים לרוב משתמשים בהם במיילים
    const flightWords = CATEGORY_KEYWORDS.flight.filter(w => /^[a-zA-Z\s]+$/.test(w));
    const hotelWords = CATEGORY_KEYWORDS.hotel.filter(w => /^[a-zA-Z\s]+$/.test(w));

    const combinedKeywords = [...flightWords, ...hotelWords].slice(0, 10);
    const wordsQuery = combinedKeywords.join(' OR ');

    return `has:attachment (${wordsQuery}) after:${dateQuery}`;
  }

  /**
   * משיכת מזהי ההודעות מ-Gmail API
   */
  private static async fetchMessageIds(token: string, query: string): Promise<string[]> {
    if (!token || token.trim() === '') {
      console.warn('[EmailSyncService] יש למלא כאן טוקן התחברות OAuth / מפתח API עבור סנכרון חשבון Gmail.');
      return [];
    }

    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`שגיאת רשת מ-Gmail API: ${res.status}`);
      }

      const data = await res.json();
      return (data.messages || []).map((m: { id: string }) => m.id);
    } catch (err) {
      console.error('[EmailSyncService] שגיאה במשיכת מזהי הודעות:', err);
      return [];
    }
  }

  /**
   * חילוץ קבצים מצורפים מתוך הודעה
   */
  private static async extractAttachments(token: string, messageId: string): Promise<EmailAttachment[]> {
    if (!token || token.trim() === '') {
      return [];
    }

    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return [];

      const messageData = await res.json();
      const attachments: EmailAttachment[] = [];
      const parts = messageData.payload?.parts || [];

      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          const attachUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${part.body.attachmentId}`;
          const attachRes = await fetch(attachUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (attachRes.ok) {
            const attachData = await attachRes.json();
            attachments.push({
              fileName: part.filename,
              mimeType: part.mimeType || 'application/pdf',
              dataBase64: attachData.data || '',
            });
          }
        }
      }

      return attachments;
    } catch (err) {
      console.error('[EmailSyncService] שגיאה בהורדת קבצים מצורפים:', err);
      return [];
    }
  }
}