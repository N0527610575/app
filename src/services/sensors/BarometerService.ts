/**
 * @file BarometerService.ts
 * @description
 * שירות קריאת מד לחץ האוויר של המכשיר (Barometer).
 * השירות מנטר את הלחץ באטמוספירה ומזהה שינויים דרסטיים.
 * במהלך המראה, המטוס מדחס את תא הנוסעים (Cabin Pressurization),
 * מה שגורם לירידה משמעותית בלחץ האוויר בתוך תא הנוסעים ביחס ללחץ בקרקע.
 * זיהוי ירידה זו מאפשר לדעת בוודאות שהמראנו, גם ללא GPS או רשת אינטרנט.
 */

import { Barometer } from 'expo-sensors';
import { AppConfig } from '../../core/constants/AppConfig';

export class BarometerService {
  private baseGroundPressure: number | null = null; // הלחץ ההתחלתי שנמדד בשדה התעופה
  private currentPressure: number = 1013.25;        // ברירת מחדל (פני הים)
  private isMonitoring: boolean = false;
  private subscription: { remove: () => void } | null = null;

  /**
   * מתחיל להאזין לחיישן הברומטר של המכשיר
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      const isAvailable = await Barometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn("[BarometerService] חיישן ברומטר אינו זמין במכשיר זה.");
        return;
      }

      console.log("[BarometerService] מתחיל לנטר לחץ ברומטרי דרך expo-sensors...");
      this.isMonitoring = true;
      Barometer.setUpdateInterval(5000);

      this.subscription = Barometer.addListener(({ pressure }) => {
        this.handlePressureUpdate(pressure);
      });
    } catch (error) {
      console.warn("[BarometerService] שגיאה באתחול ברומטר:", error);
    }
  }

  /**
   * מפסיק את ההאזנה לחיישן כדי לחסוך סוללה כשאין טיסה קרובה
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log("[BarometerService] עוצר ניטור ברומטרי.");
    this.subscription?.remove();
    this.subscription = null;
    this.isMonitoring = false;
    this.baseGroundPressure = null;
  }

  /**
   * הפונקציה הלוגית שמעבדת את קריאת הלחץ מהחיישן
   * @param pressure לחץ האוויר הנוכחי ב-hPa (הקטופסקל)
   */
  public handlePressureUpdate(pressure: number): void {
    this.currentPressure = pressure;

    // אם טרם קבענו את לחץ הבסיס בקרקע, נקבע אותו עכשיו
    if (this.baseGroundPressure === null) {
      this.baseGroundPressure = pressure;
      console.log(`[BarometerService] לחץ קרקע בסיסי נקבע ל: ${pressure.toFixed(2)} hPa`);
    }
  }

  /**
   * פונקציה הנקראת על ידי מכונת המצבים (ContextStateMachine) כדי לבדוק
   * האם תא הנוסעים דחוס (כלומר - האם המטוס נמצא באוויר כרגע)
   * @returns true אם אנחנו באוויר, false אם בקרקע
   */
  public isInFlightPressure(): boolean {
    if (this.baseGroundPressure === null) return false;

    // מחשבים את הפרש הלחץ בין הקרקע לעכשיו
    const pressureDrop = this.baseGroundPressure - this.currentPressure;

    // אם הלחץ ירד בערך שעולה על הסף שהגדרנו (למשל 30 hPa) - סימן שאנחנו באוויר
    if (pressureDrop >= AppConfig.barometer.takeoffPressureDropThreshold) {
      return true;
    }

    return false;
  }
}