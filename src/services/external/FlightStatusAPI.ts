/**
 * @file FlightStatusAPI.ts
 * @description
 * שירות סנכרון נתוני טיסה בזמן אמת מול API חיצוני.
 * השירות מקבל את קוד הטיסה (למשל LY385) ותאריך ההמראה, ומושך נתונים קריטיים
 * שמשתנים בזמן אמת: שער העלייה למטוס (Gate), עיכובים (Delays),
 * ומסוע איסוף המזוודות בנחיתה (Baggage Belt).
 * האפליקציה תשתמש בזה כשיש חיבור אינטרנט כדי להעשיר את המידע למשתמש.
 */

// נגדיר את מבנה הנתונים שאנחנו מצפים לקבל מהשרת
export interface LiveFlightStatus {
  flightNumber: string;
  status: 'SCHEDULED' | 'DELAYED' | 'DEPARTED' | 'LANDED' | 'CANCELLED';
  departureGate?: string;         // שער העלייה למטוס בטרמינל
  arrivalBaggageBelt?: string;    // מספר המסוע לאיסוף המזוודות ביעד
  estimatedDepartureTime: string; // זמן המראה מעודכן (ISO)
  estimatedArrivalTime: string;   // זמן נחיתה מעודכן (ISO)
}

export class FlightStatusAPI {
  // כתובת ה-API החיצוני
  private static readonly API_BASE_URL = 'https://api.aviationstack.com/v1/flights';

  // יש למלא כאן מפתח API עבור שירות זמני טיסות וסטטוס טיסות (למשל: Aviationstack / FlightStats)
  private static readonly API_KEY: string = 'https://data.gov.il/api/3/action/datastore_search?resource_id=e83f763b-b7d7-479e-b172-ae981ddc6de5&limit=100';

  /**
   * מושך את הסטטוס העדכני של הטיסה
   * @param flightNumber מספר הטיסה (כפי שחולץ מהברקוד, למשל LY385)
   * @param scheduledDate תאריך הטיסה כדי להימנע מקבלת טיסה של אתמול
   */
  public static async fetchLiveStatus(flightNumber: string, scheduledDate: string): Promise<LiveFlightStatus | null> {
    try {
      console.log(`[FlightStatusAPI] בודק סטטוס עדכני עבור טיסה ${flightNumber}...`);

      // בדיקה האם הוגדר מפתח API
      if (!this.API_KEY || this.API_KEY.trim() === '') {
        console.warn('[FlightStatusAPI] יש למלא כאן מפתח API עבור שירות זמני טיסות (Aviationstack). מחזיר נתוני ברירת מחדל מתוזמנים.');
        return {
          flightNumber: flightNumber,
          status: 'SCHEDULED',
          departureGate: 'B22',
          arrivalBaggageBelt: 'מסוע 8',
          estimatedDepartureTime: scheduledDate,
          estimatedArrivalTime: new Date(new Date(scheduledDate).getTime() + 4 * 60 * 60 * 1000).toISOString(),
        };
      }

      // קריאה חיה לשרת ה-API כאשר המפתח מוגדר
      const requestUrl = `${this.API_BASE_URL}?access_key=${encodeURIComponent(this.API_KEY)}&flight_iata=${encodeURIComponent(flightNumber)}`;
      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error(`שגיאת שרת בקבלת סטטוס טיסה: ${response.status}`);
      }

      const json = await response.json();
      const flightData = json.data && json.data.length > 0 ? json.data[0] : null;

      if (!flightData) {
        console.warn('[FlightStatusAPI] לא נמצאו נתונים עדכניים עבור טיסה זו ב-API.');
        return null;
      }

      return {
        flightNumber: flightData.flight?.iata || flightNumber,
        status: (flightData.flight_status?.toUpperCase() as LiveFlightStatus['status']) || 'SCHEDULED',
        departureGate: flightData.departure?.gate || undefined,
        arrivalBaggageBelt: flightData.arrival?.baggage ? `מסוע ${flightData.arrival.baggage}` : undefined,
        estimatedDepartureTime: flightData.departure?.estimated || scheduledDate,
        estimatedArrivalTime: flightData.arrival?.estimated || new Date(new Date(scheduledDate).getTime() + 4 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error('[FlightStatusAPI] שגיאה במשיכת נתוני הטיסה:', error);
      // במקרה של שגיאה או חוסר קליטה, נחזיר null והאפליקציה תסתמך על הנתונים מהכרטיס המקומי
      return null;
    }
  }
}
