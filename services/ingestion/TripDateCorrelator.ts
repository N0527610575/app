/**
 * @file TripDateCorrelator.ts
 * @description
 * קובץ זה אחראי על הצלבת תאריכים (Date Correlation).
 * הוא מקבל רשימה של תאריכים שחולצו מתוך מסמך (כמו תאריך צ'ק-אין למלון או תחילת ביטוח),
 * ובודק האם התאריכים האלו נופלים בתוך חלון הזמן של הטיסה שלנו (עוגן הטיול).
 * מונע מצב שבו פוליסת ביטוח משנה שעברה משויכת בטעות לטיסה של מחר.
 */

import { TripAnchor } from '../../core/types/Trip';
import { AppConfig } from '../../core/constants/AppConfig';

export class TripDateCorrelator {

  /**
   * הפונקציה המרכזית שבודקת האם מסמך שייך לטיול הנוכחי
   * @param documentDates רשימת התאריכים שחולצו מהמסמך (אובייקטים של Date)
   * @param anchor עוגן הטיול (מתי ממריאים ומתי חוזרים)
   * @returns true אם המסמך שייך לטיול, false אם לא
   */
  public static isDocumentRelevantForTrip(documentDates: Date[], anchor: TripAnchor): boolean {
    if (!documentDates || documentDates.length === 0) {
      // אם אי אפשר לחלץ תאריך מהמסמך, נעדיף לא לסנן אותו אוטומטית
      // אלא להעביר אותו לבחינה ידנית / קטגוריית "כללי"
      return false;
    }

    const { startWindow, endWindow } = this.calculateTripWindow(anchor);

    // מספיק שתאריך אחד במסמך ייפול בתוך החלון כדי שהמסמך יהיה רלוונטי
    for (const docDate of documentDates) {
      if (docDate >= startWindow && docDate <= endWindow) {
        return true;
      }
    }

    return false;
  }

  /**
   * חישוב חלון הזמן של הטיול, כולל שולי ביטחון (Margin) המוגדרים ב-AppConfig
   * (למשל: מלון יכול להתחיל 48 שעות לפני הטיסה אם מקדימים נסיעה)
   */
  private static calculateTripWindow(anchor: TripAnchor): { startWindow: Date, endWindow: Date } {
    const departureDate = new Date(anchor.departureDate);
    const returnDate = anchor.returnDate ? new Date(anchor.returnDate) : departureDate;

    // הגדרת תחילת החלון הרלוונטי (למשל 48 שעות לפני ההמראה)
    const startWindow = new Date(departureDate);
    startWindow.setHours(startWindow.getHours() - AppConfig.scanning.tripCorrelationWindowHours);

    // הגדרת סוף החלון הרלוונטי (למשל 48 שעות אחרי תאריך החזרה)
    const endWindow = new Date(returnDate);
    endWindow.setHours(endWindow.getHours() + AppConfig.scanning.tripCorrelationWindowHours);

    return { startWindow, endWindow };
  }
}