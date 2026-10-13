/**
 * @file NavigationService.ts
 * @description
 * שירות ניווט חיצוני וקישורים עמוקים (Deep Linking).
 * מקשר בין האפליקציה שלנו לבין אפליקציות הניווט המותקנות במכשיר המשתמש (כמו Google Maps).
 * מאפשר פתיחה ישירה של מפות ומסלולי ניווט ליעד (מלון, חניון רכבים שכורים, תחנת רכבת),
 * בהתבסס על הנתונים שחולצו ממסמכי הנסיעה.
 */

// ייבוא מובנה מתוך React Native לטיפול בקישורים חיצוניים ומערכת ההפעלה
import { Linking, Platform } from 'react-native';

export class NavigationService {
  // יש למלא כאן מפתח API עבור Google Maps Platform / Directions API (במידת הצורך לשירותי מפות מתקדמים)
  private static readonly GOOGLE_MAPS_API_KEY: string = '';

  /**
   * פתיחת אפליקציית מפות ליעד ספציפי מבוסס קואורדינטות (GPS)
   * @param latitude קו רוחב
   * @param longitude קו אורך
   * @param label (אופציונלי) שם המקום שיוצג בסיכה על המפה (למשל: "Avis Car Rental")
   */
  public static async navigateToCoordinates(latitude: number, longitude: number, label?: string): Promise<void> {
    try {
      console.log(`[NavigationService] מכין ניווט לקואורדינטות: ${latitude}, ${longitude}`);

      // קישור אוניברסלי שעובד גם באנדרואיד וגם ב-iOS ופותח את גוגל מפות
      const query = `${latitude},${longitude}`;
      const apiKeyParam = this.GOOGLE_MAPS_API_KEY ? `&key=${encodeURIComponent(this.GOOGLE_MAPS_API_KEY)}` : '';

      const url = Platform.select({
        // באנדרואיד נוכל להשתמש ב-geo intent המובנה
        android: `geo:0,0?q=${query}${label ? `(${encodeURIComponent(label)})` : ''}`,
        // ב-iOS או כברירת מחדל, נשתמש ב-URL של גוגל מפות
        default: `https://www.google.com/maps/search/?api=1&query=${query}${apiKeyParam}`
      });

      if (!url) return;

      // בדיקה האם המכשיר מסוגל לפתוח את הקישור הזה
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback למקרה שאין אפליקציית מפות נתמכת - פתיחה בדפדפן
        const browserUrl = `https://www.google.com/maps/search/?api=1&query=${query}${apiKeyParam}`;
        await Linking.openURL(browserUrl);
      }

    } catch (error) {
      console.error("[NavigationService] שגיאה בניסיון לפתוח אפליקציית ניווט:", error);
    }
  }

  /**
   * פתיחת ניווט המבוסס על כתובת טקסטואלית (כשאין לנו נתוני GPS מדויקים)
   * @param address הכתובת שחולצה מהשובר (למשל: "Via Giovanni Giolitti 4, Rome")
   */
  public static async navigateToAddress(address: string): Promise<void> {
    try {
      if (!address) return;

      console.log(`[NavigationService] מכין ניווט לכתובת: ${address}`);

      // קידוד הטקסט כך שיתאים לפורמט של קישור (הפיכת רווחים ל-%20 וכו')
      const encodedAddress = encodeURIComponent(address);
      const apiKeyParam = this.GOOGLE_MAPS_API_KEY ? `&key=${encodeURIComponent(this.GOOGLE_MAPS_API_KEY)}` : '';
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}${apiKeyParam}`;

      await Linking.openURL(url);

    } catch (error) {
      console.error("[NavigationService] שגיאה בניווט לפי כתובת:", error);
    }
  }
}