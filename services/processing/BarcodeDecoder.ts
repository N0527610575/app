/**
 * @file BarcodeDecoder.ts
 * @description
 * קובץ זה משמש כמנוע הפענוח (Decoder) של ברקודים מכרטיסי טיסה.
 * הוא מקבל את הטקסט הגולמי שחולץ מהברקוד (באמצעות המצלמה או מסריקת PDF),
 * מוודא שמדובר בכרטיס טיסה תקין (לפי תקן IATA BCBP),
 * ומחלץ ממנו בצורה אוטומטית את שם הנוסע, יעד, מקור, ומספר המושב.
 * זהו הבסיס שמאפשר לאפליקציה לדעת מי הנוסע ואיפה הוא אמור לשבת בלי לשאול אותו.
 */

import { BarcodePayload } from '../../core/types/Document';

export interface ParsedFlightData {
  passengerName: string;
  pnr: string;              // קוד ההזמנה (6-7 תווים)
  originPort: string;       // קוד שדה תעופה מוצא (למשל TLV)
  destinationPort: string;  // קוד שדה תעופה יעד (למשל FCO)
  airlineCode: string;      // קוד חברת תעופה (למשל LY לאל על)
  flightNumber: string;     // מספר טיסה (למשל 385)
  seatNumber: string;       // מספר מושב נקי (למשל 27E)
}

export class BarcodeDecoder {

  /**
   * הפונקציה המרכזית שמקבלת את הנתונים הגולמיים של הברקוד ומחזירה אובייקט מסודר.
   * התקן קובע אורכים קבועים לכל שדה, ולכן אנו משתמשים ב-substring כדי לחתוך בדיוק במקום.
   */
  public static parseBCBP(payload: BarcodePayload): ParsedFlightData | null {
    const raw = payload.rawData;

    // תקן כרטיסי הטיסה (BCBP) מתחיל תמיד באות 'M'
    if (!raw.startsWith('M')) {
      console.warn("הברקוד שנסרק אינו תואם לתקן כרטיסי טיסה.");
      return null;
    }

    try {
      // חילוץ שם הנוסע (תווים 2 עד 22 בתקן) וניקוי רווחים מיותרים
      const rawName = raw.substring(2, 22).trim();
      const passengerName = this.formatPassengerName(rawName);

      // חילוץ קוד ההזמנה PNR (תווים 23 עד 29)
      const pnr = raw.substring(23, 30).trim();

      // חילוץ שדות התעופה (מוצא ויעד)
      const originPort = raw.substring(30, 33).trim();
      const destinationPort = raw.substring(33, 36).trim();

      // חילוץ פרטי הטיסה (חברת תעופה ומספר טיסה)
      const airlineCode = raw.substring(36, 39).trim();
      const flightNumber = raw.substring(39, 44).trim();

      // חילוץ מספר המושב (תווים 48 עד 51). בתקן זה מופיע לעתים קרובות עם אפסים (027E)
      const rawSeat = raw.substring(48, 52).trim();
      const seatNumber = this.cleanSeatNumber(rawSeat);

      return {
        passengerName,
        pnr,
        originPort,
        destinationPort,
        airlineCode,
        flightNumber,
        seatNumber
      };

    } catch (error) {
      console.error("שגיאה בפענוח נתוני הברקוד:", error);
      return null;
    }
  }

  /**
   * פונקציית עזר לסידור שם הנוסע (הפיכת HASSON/NACHMAN ל- Nachman Hasson)
   */
  private static formatPassengerName(rawName: string): string {
    if (!rawName.includes('/')) return rawName;

    const parts = rawName.split('/');
    const lastName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const firstName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();

    return `${firstName} ${lastName}`;
  }

  /**
   * פונקציית עזר לניקוי מספר המושב (הופכת "027E" ל-"27E")
   */
  private static cleanSeatNumber(rawSeat: string): string {
    // הסרת אפסים מובילים באמצעות ביטוי רגולרי (Regex)
    return rawSeat.replace(/^0+/, '');
  }
}