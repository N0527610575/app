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

  /**
   * הפונקציה המרכזית לסנכרון מיילים רלוונטיים לנסיעה.
   * @param accessToken טוקן גישה מאובטח (OAuth) של המשתמש
   * @param anchor עוגן הטיול כדי לדעת ממתי להתחיל לחפש מיילים
   * @returns רשימה של קבצים מצורפים שחולצו מהמיילים
   */
  public static async syncTravelEmails(accessToken: string, anchor: TripAnchor): Promise<EmailAttachment[]> {
    try {
      console.log("[EmailSyncService] מתחיל סנכרון מיילים חכם...");

      // 1. בניית שאילתת החיפוש (למשל בפורמט של Gmail API)
      const searchQuery = this.buildSearchQuery(anchor.scanWindowStartDate);
      console.log(`[EmailSyncService] שאילתת חיפוש: ${searchQuery}`);

      // 2. קריאה ל-API של ספק המייל (מדמה קריאת רשת ל-Gmail API)
      // בפועל פה נשתמש בספרייה כמו 'gapi.client.gmail'
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

    const combinedKeywords = [...flightWords, ...hotelWords].slice(0, 10); // ניקח את 10 החזקות ביותר
    const wordsQuery = combinedKeywords.join(' OR ');

    return `has:attachment (${wordsQuery}) after:${dateQuery}`;
  }

  // =========================================================================
  // פונקציות דמה (Mock) לצורך הדגמת הקריאות ל-API (ימומשו מול ספריות Native)
  // =========================================================================

  private static async fetchMessageIds(token: string, query: string): Promise<string[]> {
    // מדמה קריאה לשרת להבאת רשימת מזהי הודעות (IDs)
    return Promise.resolve(['msg_12345', 'msg_67890']);
  }

  private static async extractAttachments(token: string, messageId: string): Promise<EmailAttachment[]> {
    // מדמה הורדת PDF מתוך המייל
    return Promise.resolve([
      {
        fileName: `ticket_${messageId}.pdf`,
        mimeType: 'application/pdf',
        dataBase64: 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4n...' // דמה
      }
    ]);
  }
}