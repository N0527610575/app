/**
 * @file AppConfig.ts
 * @description
 * קובץ הגדרות המערכת (Configuration).
 * מכיל את כל הקבועים (Constants), טווחי הזמן, והמרחקים שהאפליקציה משתמשת בהם
 * כדי להחליט מתי לסרוק מסמכים, מתי להעיר את המסך, ומתי לשנות מצב.
 * ריכוז הנתונים כאן מאפשר לשנות התנהגות בקלות מבלי לגעת בלוגיקה של הקוד.
 */

export const AppConfig = {
  // הגדרות סריקת קבצים ומסמכים (Ingestion)
  scanning: {
    // כמה חודשים אחורה לסרוק קבצים ביחס לתאריך הטיסה (כדי למצוא ביטוח ישן)
    maxRetroactiveScanMonths: 12,

    // כמה שעות לפני/אחרי טיסה מסמך (כמו מלון) נחשב רלוונטי לאותה נסיעה
    tripCorrelationWindowHours: 48,

    // סיומות הקבצים שהמערכת רשאית לסרוק בחיפוש המקומי
    allowedFileExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  },

  // הגדרות שירותי מיקום וחיישנים (Sensors & Geofence)
  location: {
    // רדיוס (במטרים) סביב שדה התעופה שבו האפליקציה נכנסת ל"מצב טרמינל"
    airportGeofenceRadiusMeters: 1500,

    // רדיוס (במטרים) לזיהוי הגעה ליעד ספציפי (מלון, השכרת רכב)
    destinationGeofenceRadiusMeters: 200,
  },

  // הגדרות תזמונים והתראות (Time Triggers)
  timing: {
    // כמה דקות לפני הטיסה המערכת מקפיצה את הברקוד ומזכירה להכין דרכון
    showBoardingPassMinutesBefore: 45,

    // כמה דקות של חוסר תנועה במטוס דרושות כדי להינעל על "מצב ישיבה"
    motionlessMinutesToConfirmSeat: 3,
  },

  // הגדרות ברומטר (לחץ אוויר)
  barometer: {
    // סף השינוי בלחץ האוויר (ב-hPa) שמעיד על דיחוס תא נוסעים בהמראה
    // הערך יהיה ירידה חדה בלחץ ביחס ללחץ בקרקע.
    takeoffPressureDropThreshold: 30,
  }
};