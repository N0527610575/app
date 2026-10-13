/**
 * @file LocationService.ts
 * @description
 * שירות המיקום והגידור הגיאוגרפי (Geofencing).
 * מגדיר אזורים וירטואליים סביב שדות תעופה ויעדים (מלון, השכרת רכב).
 * פועל בצורה חסכונית בסוללה (Background Location) ומקפיץ אירוע
 * רק כאשר המשתמש נכנס או יוצא מהרדיוס המוגדר.
 */

import * as Location from 'expo-location';
import { AirportLocation } from '../../core/types/Trip';
import { AppConfig } from '../../core/constants/AppConfig';

export class LocationService {
  private isGeofenceActive: boolean = false;
  private currentAirportZone: AirportLocation | null = null;
  private isUserInsideAirport: boolean = false;
  private locationSubscription: Location.LocationSubscription | null = null;

  /**
   * בקשת הרשאות מיקום מהמשתמש
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      console.log("[LocationService] מבקש הרשאות מיקום (חזית ורקע)...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        await Location.requestBackgroundPermissionsAsync().catch(() => {
          // טיפול סובלני במידה וסביבת ההרצה אינה תומכת ברקע (למשל ווב או סימולטור)
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("[LocationService] שגיאה בבקשת הרשאת מיקום:", error);
      return false;
    }
  }

  /**
   * הקמת המעגל הווירטואלי סביב שדה התעופה ומעקב מיקום
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

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      this.locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        (loc) => {
          this.checkDistanceToAirport(loc.coords.latitude, loc.coords.longitude);
        }
      );
    } catch (error) {
      console.warn("[LocationService] שגיאה בהפעלת ניטור מיקום:", error);
    }
  }

  /**
   * חישוב מרחק לשדה התעופה (נוסחת Haversine)
   */
  private checkDistanceToAirport(latitude: number, longitude: number): void {
    if (!this.currentAirportZone?.coordinates) return;

    const dLat = (this.currentAirportZone.coordinates.latitude - latitude) * (Math.PI / 180);
    const dLon = (this.currentAirportZone.coordinates.longitude - longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latitude * (Math.PI / 180)) *
        Math.cos(this.currentAirportZone.coordinates.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = 6371000 * c;

    const inside = distanceMeters <= AppConfig.location.airportGeofenceRadiusMeters;
    if (inside !== this.isUserInsideAirport) {
      this.isUserInsideAirport = inside;
      console.log(`[LocationService] סטטוס שדה תעופה: ${inside ? 'בתוך השדה' : 'מחוץ לשדה'} (מרחק: ${Math.round(distanceMeters)}m)`);
    }
  }

  /**
   * אירוע מעבר גבול אזור
   */
  public handleGeofenceEvent(eventType: 'ENTER' | 'EXIT', regionId: string): void {
    if (this.currentAirportZone?.code === regionId) {
      this.isUserInsideAirport = (eventType === 'ENTER');
      console.log(`[LocationService] אירוע מיקום: המשתמש ${this.isUserInsideAirport ? 'נכנס ל' : 'יצא מ'}שדה התעופה ${regionId}.`);
    }
  }

  /**
   * מחזיר האם המשתמש נמצא כרגע בתוך פוליגון שדה התעופה
   */
  public isAtAirport(): boolean {
    return this.isUserInsideAirport;
  }

  /**
   * עצירת הניטור לחיסכון בסוללה
   */
  public stopGeofencing(): void {
    if (!this.isGeofenceActive) return;

    console.log("[LocationService] עוצר ניטור מיקום.");
    this.locationSubscription?.remove();
    this.locationSubscription = null;
    this.isGeofenceActive = false;
    this.currentAirportZone = null;
    this.isUserInsideAirport = false;
  }
}