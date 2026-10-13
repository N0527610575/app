/**
 * @file Document.ts
 * @description
 * מגדיר את מבנה הנתונים (Interface) עבור כל מסמך שנשמר במערכת.
 * מכיל את כל המידע הנדרש כדי להציג את המסמך הנכון בזמן הנכון,
 * כולל נתוני הברקוד (אם יש), נתיב הקובץ המקומי במכשיר, והטריגר שמקפיץ אותו.
 */

// קטגוריות אפשריות למסמך
export type DocumentCategory =
  | 'flight'       // כרטיסי עלייה למטוס, כרטיסי טיסה
  | 'hotel'        // אישורי הזמנת מלון, דירות נופש
  | 'car_rental'   // שוברי השכרת רכב
  | 'insurance'    // פוליסות ביטוח נסיעות וכיסוי רפואי
  | 'train'        // כרטיסי רכבת ותחבורה ציבורית
  | 'passport'     // תעודות זיהוי ודרכונים
  | 'custom';      // מסמך שנוסף ידנית ללא קטגוריה מוגדרת

// סוגי הברקודים הנתמכים בסריקה
export type BarcodeFormat = 'PDF417' | 'AZTEC' | 'QR_CODE' | 'CODE_128' | 'NONE';

// מבנה הנתונים של ברקוד שנסרק ופוענח
export interface BarcodePayload {
  format: BarcodeFormat;
  rawData: string;                 // המחרוזת הגולמית (למשל תקן BCBP)
  passengerName?: string;          // שם הנוסע שחולץ מהברקוד
  seatNumber?: string;             // מספר המושב (למשל: 27E)
  flightNumber?: string;           // מספר הטיסה
}

// אילו סוגי טריגרים יכולים "להעיר" את המסמך
export type TriggerType = 'flight_phase' | 'geofence' | 'time' | 'manual_only';

// הגדרת הטריגר שיקפיץ את המסמך למסך הראשי
export interface DocumentTrigger {
  type: TriggerType;
  targetTime?: string;             // מתי להקפיץ (בפורמט תאריך ושעה)
  locationGeofence?: {             // איפה להקפיץ
    latitude: number;
    longitude: number;
    radiusMeters: number;
    name?: string;                 // שם המיקום (למשל: "השכרת רכב FCO")
  };
  flightPhaseTrigger?: 'boarding' | 'in_flight' | 'landing'; // שלב בטיסה
  isActive: boolean;               // האם הטריגר פעיל כרגע
}

// המבנה המלא של מסמך נסיעה באפליקציה
export interface TravelDocument {
  id: string;                      // מזהה ייחודי למסמך (UUID)
  tripId: string;                  // מזהה הטיול אליו הוא שייך
  passengerId?: string;            // לאיזה נוסע הוא שייך (מאפשר חלוקה לטאבים)
  title: string;                   // כותרת לתצוגה ("כרטיס עלייה למטוס - נחמן")
  category: DocumentCategory;

  // נתוני הקובץ במכשיר (Offline)
  localFilePath: string;           // איפה הקובץ שמור פיזית בטלפון
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';

  // נתונים שחולצו על ידי המנועים החכמים שלנו
  barcode?: BarcodePayload;        // אם יש ברקוד
  extractedText?: string;          // טקסט שחולץ בעזרת OCR מקומי
  extractedDates?: string[];       // תאריכים עתידיים שנמצאו במסמך

  // ניהול מצב המסמך
  trigger: DocumentTrigger;
  isArchived: boolean;             // האם המסמך ישן/כבר שומש והוסתר
  createdAt: string;               // מתי הוא נוצר במערכת
  source: 'auto_file_scan' | 'email_sync' | 'manual_upload'; // איך הוא הגיע לאפליקציה
}