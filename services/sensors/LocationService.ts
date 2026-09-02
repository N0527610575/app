/**
 * @file LocationService.ts
 * @description
 * שירות המיקום והגידור הגיאוגרפי (Geofencing).
 * מגדיר אזורים וירטואליים סביב שדות תעופה ויעדים (מלון, השכרת רכב).
 * פועל בצורה חסכונית בסוללה (Background Location) ומקפיץ אירוע
 * רק כאשר המשתמש נכנס או יוצא מהרדיוס המוגדר.
 */

import { AirportLocation } from '../../core/types/Trip';
import { AppConfig } from '../../core/constants/AppConfig';

// ייבוא דמה של ספריית מיקום נפוצה ב-React Native (כמו expo-location או react-native-background-geolocation)
// import * as Location from 'expo-location';

export class LocationService {
  private isGeofenceActive: boolean = false;
  private currentAirportZone: AirportLocation | null = null;
  private isUserInsideAirport: boolean = false;

  /**
   * בקשת הרשאות מיקום מהמשתמש (יופעל רק אחרי שהסברנו לו למה זה נחוץ)
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      console.log("[LocationService] מבקש הרשאות מיקום ברקע...");
      // const { status } = await Location.requestBackgroundPermissionsAsync();
      // return status === 'granted';
      return true; // מדמה אישור מהמשתמש
    } catch (error) {
      console.error("[LocationService] שגיאה בבקשת הרשאת מיקום:", error);
      return false;
    }
  }

  /**
   * הקמת המעגל הווירטואלי סביב שדה התעופה כדי לחכות להגעת המשתמש
   * @param airport נתוני שדה התעופה (מוצא או יעד) כולל קואורדינטות
   */
  public async setupAirportGeofence(airport: AirportLocation): Promise<void> {
    if (!airport.coordinates) {
      console.warn(`[LocationService] אין קואורדינטות לשדה התעופה ${airport.code}. לא ניתן להפעיל Geofence.`);
      return;
    }

    this.currentAirportZone = airport;
    this.isGeofenceActive = true;
    this.isUserInsideAirport = false;

    console.log(`[LocationService] מצייר מעגל Geofence סביב ${airport.code} ברדיוס ${AppConfig.location.airportGeofenceRadiusMeters} מטרים.`);

    // לוגיקת הפעלה אמיתית תירשם כאן מול מנוע ה-Background Location של המערכת
    /*
    await Location.startGeofencingAsync('AIRPORT_REGION', [{
      identifier: airport.code,
      latitude: airport.coordinates.latitude,
      longitude: airport.coordinates.longitude,
      radius: AppConfig.location.airportGeofenceRadiusMeters,
      notifyOnEnter: true,
      notifyOnExit: true,
    }]);
    */
  }

  /**
   * פונקציה המדמה את קבלת האירוע ממערכת ההפעלה כאשר המשתמש חוצה את הקו הווירטואלי.
   * מכונת המצבים (ContextStateMachine) קוראת לזה כדי לדעת איפה אנחנו.
   */
  public handleGeofenceEvent(eventType: 'ENTER' | 'EXIT', regionId: string): void {
    if (this.currentAirportZone?.code === regionId) {
      this.isUserInsideAirport = (eventType === 'ENTER');
      console.log(`[LocationService] אירוע מיקום: המשתמש ${this.isUserInsideAirport ? 'נכנס ל' : 'יצא מ'}שדה התעופה ${regionId}.`);
    }
  }

  /**
   * מחזיר האם המשתמש נמצא כרגע בתוך פוליגון שדה התעופה.
   */
  public isAtAirport(): boolean {
    return this.isUserInsideAirport;
  }

  /**
   * עצירת הניטור לחיסכון בסוללה (למשל כשהמראנו או סיימנו את הטיול)
   */
  public stopGeofencing(): void {
    if (!this.isGeofenceActive) return;

    console.log("[LocationService] עוצר ניטור מיקום Geofence.");
    // await Location.stopGeofencingAsync('AIRPORT_REGION');
    this.isGeofenceActive = false;
    this.currentAirportZone = null;
    this.isUserInsideAirport = false;
  }
}