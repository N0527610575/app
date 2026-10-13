/**
 * @file Keywords.ts
 * @description
 * קובץ זה משמש כמילון המונחים המרכזי של האפליקציה לזיהוי וסיווג אוטומטי של מסמכים.
 * הוא מכיל רשימות של מילות מפתח בעברית ובאנגלית לכל קטגוריית נסיעה.
 * מנוע סריקת הקבצים (DeepFileScanner) ומנוע זיהוי הטקסט (OCR) משתמשים במילון זה
 * כדי להבין איזה סוג מסמך המשתמש הוריד או צילם, ולתייג אותו אוטומטית.
 */

import { DocumentCategory } from '../types/Document';

// מילון מילות המפתח מחולק לפי קטגוריות המסמכים
export const CATEGORY_KEYWORDS: Record<DocumentCategory, string[]> = {

  flight: [
    'כרטיס טיסה', 'עלייה למטוס', 'שער', 'טרמינל', 'בורדינג',
    'boarding pass', 'e-ticket', 'flight', 'departure', 'gate', 'seat', 'airline',
    'el al', 'ryanair', 'wizz', 'easyjet'
  ],

  hotel: [
    'מלון', 'אישור הזמנה', 'צ\'ק אין', 'צ\'ק אאוט', 'בוקינג', 'איירבנב',
    'hotel', 'reservation', 'booking', 'check-in', 'check-out', 'airbnb', 'accommodation', 'voucher'
  ],

  car_rental: [
    'השכרת רכב', 'שכירות', 'רישיון נהיגה', 'שובר רכב', 'אויס', 'שלמה סיקסט',
    'car rental', 'rental agreement', 'pick-up', 'drop-off', 'hertz', 'sixt', 'avis', 'europcar'
  ],

  insurance: [
    'ביטוח', 'פוליסה', 'פספורטקארד', 'הראל', 'הפניקס', 'כלל', 'כיסוי רפואי', 'חוק בריאות',
    'insurance', 'policy', 'passportcard', 'medical coverage', 'emergency', 'travel insurance'
  ],

  train: [
    'רכבת', 'כרטיס נסיעה', 'תחנה',
    'train', 'railway', 'ticket', 'station', 'platform', 'eurostar', 'trenitalia'
  ],

  passport: [
    'דרכון', 'תעודת זהות', 'מדינת ישראל',
    'passport', 'identity card', 'state of israel'
  ],

  custom: []
};

/**
 * פונקציית עזר (Helper) המקבלת טקסט שחולץ ממסמך (למשל מ-OCR)
 * ומחזירה את הקטגוריה הסבירה ביותר שאליה שייך המסמך.
 */
export const classifyDocumentByText = (extractedText: string): DocumentCategory => {
  // הפיכת הטקסט לאותיות קטנות כדי למנוע בעיות של רגישות לאותיות רישיות באנגלית
  const lowerCaseText = extractedText.toLowerCase();

  let bestMatchCategory: DocumentCategory = 'custom';
  let highestMatchCount = 0;

  // מעבר על כל הקטגוריות וספירת כמות המילים התואמות
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;

    for (const keyword of keywords) {
      if (lowerCaseText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // הקטגוריה עם הכי הרבה התאמות תבחר
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      bestMatchCategory = category as DocumentCategory;
    }
  }

  // אם לא מצאנו אף התאמה ברורה, נגדיר כמסמך כללי (custom)
  return bestMatchCategory;
};