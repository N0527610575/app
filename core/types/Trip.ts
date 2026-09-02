/**
 * @file Trip.ts
 * @description
 * מגדיר את מבנה הנתונים של נסיעה שלמה (Trip).
 * זהו האובייקט המרכזי שמחזיק את כל הנתונים יחד: לאן טסים, מי הנוסעים,
 * אילו מסמכים שייכים לנסיעה, ומהו חלון הזמן הרלוונטי לחיפוש מסמכים ישנים (עוגן הטיסה).
 */

import { TravelDocument } from './Document';
import { Passenger } from './Passenger';

// הגדרת נקודת ציון - שדה תעופה
export interface AirportLocation {
  code: string;                    // קוד יאט"א של השדה (למשל: "TLV", "FCO")
  name: string;                    // שם השדה (למשל: "Ben Gurion", "Fiumicino")
  terminal?: string;               // טרמינל (למשל: "3")
  coordinates?: {                  // קואורדינטות לצורך Geofencing עתידי בשדה
    latitude: number;
    longitude: number;
  };
}

// הגדרת מקטע טיסה (רלוונטי לטיסות ישירות או קונקשנים)
export interface FlightLeg {
  flightNumber: string;            // מספר הטיסה (למשל: "LY385")
  airline: string;                 // שם חברת התעופה או קוד (למשל: "EL AL")
  origin: AirportLocation;         // מאיפה ממריאים
  destination: AirportLocation;    // לאן נוחתים
  scheduledDeparture: string;      // זמן המראה מתוכנן (בפורמט ISO-8601)
  scheduledArrival: string;        // זמן נחיתה מתוכנן (בפורמט ISO-8601)
  gate?: string;                   // שער עלייה למטוס (מתעדכן בזמן אמת מה-API)
  baggageBelt?: string;            // מסוע איסוף מזוודות (מתעדכן בנחיתה)
}

// עוגן הטיול - הבסיס לחיפוש רטרואקטיבי של מסמכים (Deep Scan)
export interface TripAnchor {
  departureDate: string;           // תאריך הטיסה הראשון (העוגן המרכזי)
  returnDate?: string;             // תאריך חזרה משוער (כדי לדעת מתי הטיול נגמר)
  scanWindowStartDate: string;     // התאריך הכי ישן שממנו נסרוק קבצים (למשל 12 חודשים אחורה מיום הטיסה)
}

// הישות המלאה של הטיול המאגדת את הכל
export interface Trip {
  id: string;                      // מזהה ייחודי לטיול
  title: string;                   // שם הטיול לתצוגה (למשל: "חופשה ברומא - מאי 2026")
  isActive: boolean;               // האם זה הטיול הנוכחי שהמשתמש נמצא בו עכשיו

  anchor: TripAnchor;              // עוגן התאריכים לסריקה
  flights: FlightLeg[];            // רשימת הטיסות (הלוך, חזור, וקונקשנים אם יש)
  passengers: Passenger[];         // מי נוסע בטיול הזה (נחמן, שולמית...)
  documents: TravelDocument[];     // כל המסמכים שאותרו ושויכו לטיול הזה (טיסות, מלון, ביטוח)

  createdAt: string;               // מתי הטיול נוצר באפליקציה
  updatedAt: string;               // תאריך עדכון אחרון
}