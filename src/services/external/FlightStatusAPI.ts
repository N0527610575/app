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
  // כתובת ה-API החיצוני (לדוגמה) ומפתח ההצפנה (שיישמר בסביבת ה-ENV בפועל)
  private static readonly API_BASE_URL = 'https://api.aviationstack.com/v1/flights';
  private static readonly API_KEY = 'YOUR_SECRET_API_KEY';

  /**
   * מושך את הסטטוס העדכני של הטיסה
   * @param flightNumber מספר הטיסה (כפי שחולץ מהברקוד, למשל LY385)
   * @param scheduledDate תאריך הטיסה כדי להימנע מקבלת טיסה של אתמול
   */
  public static async fetchLiveStatus(flightNumber: string, scheduledDate: string): Promise<LiveFlightStatus | null> {
    try {
      console.log(`[FlightStatusAPI] מושך סטטוס עדכני עבור טיסה ${flightNumber}...`);

      // בניית כתובת הבקשה (Query String)
      // בפיתוח אמיתי נשתמש בספרייה כמו Axios או Fetch
      const requestUrl = `${this.API_BASE_URL}?access_key=${this.API_KEY}&flight_iata=${flightNumber}`;

      /*
      const response = await fetch(requestUrl);
      if (!response.ok) throw new Error('שגיאת רשת במשיכת נתוני טיסה');
      const data = await response.json();
      */

      // =================================================================
      // הדמיית (Mock) תשובה מהשרת - כדי שנוכל להמשיך לפתח ללא תלות ברשת
      // =================================================================
      const mockResponse: LiveFlightStatus = {
        flightNumber: flightNumber,
        status: 'SCHEDULED',
        departureGate: 'B22',               // השער התעדכן!
        arrivalBaggageBelt: 'מסוע 8',       // מידע קריטי לנחיתה
        estimatedDepartureTime: scheduledDate,
        estimatedArrivalTime: new Date(new Date(scheduledDate).getTime() + 4 * 60 * 60 * 1000).toISOString() // הוספת 4 שעות
      };

      console.log(`[FlightStatusAPI] התקבל עדכון: שער ${mockResponse.departureGate}, מסוע מזוודות: ${mockResponse.arrivalBaggageBelt}`);
      return mockResponse;

    } catch (error) {
      console.error("[FlightStatusAPI] שגיאה במשיכת נתוני הטיסה:", error);
      // במקרה של שגיאה או חוסר קליטה, נחזיר null והאפליקציה תסתמך על הנתונים מהכרטיס
      return null;
    }
  }
}