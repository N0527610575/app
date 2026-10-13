/**
 * @file ContextState.ts
 * @description
 * קובץ זה מגדיר את מכונת המצבים של האפליקציה (Context State Machine).
 * הוא מייצג את "תמונת המצב" הנוכחית של המשתמש במסע שלו.
 * שכבת התצוגה (UI) מאזינה לאובייקט הזה ומשנה את המסך באופן אוטומטי
 * בהתאם לשלב שבו המשתמש נמצא (למשל: הקפצת ברקוד בשער, או הצגת מושב במטוס).
 */

// כל השלבים הפיזיים האפשריים במסע של המשתמש
export type TravelPhase =
  | 'IDLE_PRE_TRIP'        // לפני הנסיעה (בבית או בדרך לשדה)
  | 'AT_DEPARTURE_AIRPORT' // המשתמש הגיע לטרמינל (לפני הבורדינג)
  | 'BOARDING_GATE'        // תחילת בורדינג (זמן להציג ברקודים ודרכונים)
  | 'WALKING_JET_BRIDGE'   // הליכה בשרוול אל המטוס (זיהוי תנועה סמוך להמראה)
  | 'FINDING_SEAT'         // בתוך המטוס, מחפש את המושב
  | 'IN_FLIGHT'            // המטוס באוויר (זוהתה צניחת לחץ ברומטרי)
  | 'LANDED_AT_DESTINATION'// נחיתה ביעד (זמן להציג הוראות הגעה ושוברי רכב/מלון)
  | 'POST_TRIP';           // סיום הטיול (חזרה לשגרה)

// המבנה של מצב האפליקציה ברגע נתון
export interface ContextState {
  // השלב המרכזי שבו אנחנו נמצאים עכשיו
  currentPhase: TravelPhase;

  // מצביעים למידע הפעיל (מתוך קובץ ה-Trip)
  activeTripId?: string;           // איזה טיול מתרחש כעת
  activePassengerId?: string;      // איזה נוסע מוצג כרגע במסך הראשי (עבור הטאבים)

  // הוראות לתצוגה (UI Helpers)
  toastMessage?: string;           // הודעת הבועה העליונה (למשל: "נא להכין דרכון פתוח")
  highlightedSeat?: string;        // מספר המושב שיש להציג בגדול (למשל: "27E")
  isBarcodeHeroVisible: boolean;   // האם הברקוד אמור להיות הדבר המרכזי במסך

  // נתוני חיישנים עדכניים שמשפיעים על המצב
  lastBarometerPressure?: number;  // קריאת לחץ האוויר האחרונה (ב-hPa) לזיהוי המראה/נחיתה
  isMoving: boolean;               // האם המשתמש הולך כרגע (מבוסס מד תאוצה)
  estimatedMinutesToArrival?: number; // זמן משוער לנחיתה (רלוונטי למצב IN_FLIGHT)
}