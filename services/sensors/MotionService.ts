/**
 * @file MotionService.ts
 * @description
 * שירות זיהוי תנועה באמצעות מד התאוצה (Accelerometer) של המכשיר.
 * השירות מנתח את עוצמת התנועה כדי להבחין בין הליכה (למשל בשרוול המטוס)
 * לבין ישיבה במקום (למשל לאחר מציאת המושב).
 * נתון זה קריטי למכונת המצבים כדי לדעת מתי להסתיר את הברקוד ולנעול את המסך על "מצב טיסה".
 */

import { AppConfig } from '../../core/constants/AppConfig';

// ייבוא דמה של ספריית חיישנים מקומית ב-React Native
// import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

export class MotionService {
  private isMonitoring: boolean = false;
  private isCurrentlyWalking: boolean = false;

  // טיימר לניטור זמני מנוחה (חוסר תנועה)
  private motionlessStartTime: number | null = null;

  // סף התנועה (Magnitude) שמעליו נחשב שהמשתמש צועד
  private readonly WALKING_THRESHOLD = 1.2;

  /**
   * מתחיל להאזין למד התאוצה
   */
  public startMonitoring() {
    if (this.isMonitoring) return;

    console.log("[MotionService] מתחיל לנטר תנועה (מד תאוצה)...");
    this.isMonitoring = true;
    this.motionlessStartTime = null;

    // בפועל, כאן נגדיר קריאה מהחיישן (למשל פעמיים בשנייה כדי לא להכביד)
    // setUpdateIntervalForType(SensorTypes.accelerometer, 500);

    // this.subscription = accelerometer.subscribe(({ x, y, z }) => {
    //   this.analyzeMotion(x, y, z);
    // });
  }

  /**
   * עוצר את האזנה לחיישן
   */
  public stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log("[MotionService] עוצר ניטור תנועה.");
    // this.subscription?.unsubscribe();
    this.isMonitoring = false;
    this.isCurrentlyWalking = false;
  }

  /**
   * האלגוריתם המנתח את צירי ה-XYZ של מד התאוצה כדי לזהות הליכה לעומת ישיבה
   */
  private analyzeMotion(x: number, y: number, z: number): void {
    // חישוב הווקטור הכולל של התאוצה (כולל כוח הכבידה של כדור הארץ - שמוגדר כ-1G)
    // נוסחת פיתגורס תלת-ממדית
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    // בהנחה שהקריאות מנורמלות ל-G, ערך של 1 משמעותו מנוחה מוחלטת.

    if (magnitude > this.WALKING_THRESHOLD) {
      // תנועה משמעותית זוהתה (הליכה)
      this.isCurrentlyWalking = true;
      this.motionlessStartTime = null; // מאפסים את טיימר המנוחה
    } else {
      // מצב מנוחה (ישיבה או טלפון מונח)
      this.isCurrentlyWalking = false;

      if (this.motionlessStartTime === null) {
        this.motionlessStartTime = Date.now();
      }
    }
  }

  /**
   * הפונקציה נקראת על ידי מכונת המצבים כדי לדעת אם המשתמש התיישב במקומו
   * בהתבסס על הזמן שהוגדר בהגדרות המערכת (AppConfig).
   * @returns true אם המשתמש יושב ללא תנועה במשך הזמן הנדרש
   */
  public hasUserSatDown(): boolean {
    if (this.isCurrentlyWalking || this.motionlessStartTime === null) {
      return false;
    }

    const minutesMotionless = (Date.now() - this.motionlessStartTime) / (1000 * 60);

    // אם חלפו X דקות ללא הליכה (כמוגדר ב-AppConfig), המשתמש כנראה התיישב במטוס
    return minutesMotionless >= AppConfig.timing.motionlessMinutesToConfirmSeat;
  }

  /**
   * מחזיר אינדיקציה מיידית האם יש הליכה עכשיו
   */
  public isWalking(): boolean {
    return this.isCurrentlyWalking;
  }
}