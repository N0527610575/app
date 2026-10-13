/**
 * @file LocalOCREngine.ts
 * @description
 * מנוע זיהוי טקסט מקומי על המכשיר (On-Device Local OCR Engine).
 * בהתאם לעקרון הליבה: "פרטיות מקומית תחילה (Local & Offline First)",
 * מנוע זה פועל באופן מלא ללא גישה לאינטרנט או שרתים חיצוניים.
 * הוא סורק מסמכים (תמונות, סריקות ו-PDF), מחלץ טקסט גולמי, ומפענח
 * ישויות נסיעה קריטיות: סוג מסמך, תאריכים, מספר טיסה, קוד הזמנה (PNR) ושמות נוסעים.
 */

import { DocumentCategory, TravelDocument } from '../../core/types/Document';
import { classifyDocumentByText } from '../../core/constants/Keywords';

export interface OCRParsedResult {
  rawText: string;
  category: DocumentCategory;
  dates: Date[];
  flightNumber?: string;
  pnr?: string;
  passengerName?: string;
  confidence: number;
}

export class LocalOCREngine {
  /**
   * פענוח מקומי של קובץ (תמונה או מסמך מקומי)
   * מעבד את התמונה במכשיר ומחלץ את תוכן הטקסט והישויות
   * @param localFilePath נתיב הקובץ המקומי במכשיר
   * @param overrideText (אופציונלי) תוכן טקסטואלי ישיר במידה וחולץ כבר מקובץ PDF
   */
  public static async recognizeTextLocally(
    localFilePath: string,
    overrideText?: string
  ): Promise<OCRParsedResult> {
    try {
      console.log(`[LocalOCREngine] מתחיל עיבוד OCR מקומי עבור: ${localFilePath}`);

      // חילוץ הטקסט המקומי
      const extractedText = overrideText || (await this.extractTextFromPath(localFilePath));

      // סיווג קטגוריית המסמך באמצעות מילון המונחים
      const category = classifyDocumentByText(extractedText);

      // חילוץ תאריכים
      const dates = this.extractDates(extractedText);

      // חילוץ מספר טיסה
      const flightNumber = this.extractFlightNumber(extractedText);

      // חילוץ קוד הזמנה (PNR)
      const pnr = this.extractPNR(extractedText);

      // חילוץ שם נוסע אפשרי
      const passengerName = this.extractPassengerName(extractedText);

      return {
        rawText: extractedText,
        category,
        dates,
        flightNumber,
        pnr,
        passengerName,
        confidence: 0.95,
      };
    } catch (error) {
      console.error('[LocalOCREngine] שגיאה בעיבוד OCR מקומי:', error);
      return {
        rawText: '',
        category: 'custom',
        dates: [],
        confidence: 0,
      };
    }
  }

  /**
   * יצירת אובייקט TravelDocument מוכן לשמירה ב-Database על סמך פלט ה-OCR
   */
  public static createDocumentFromOCR(
    tripId: string,
    filePath: string,
    ocrResult: OCRParsedResult,
    fileName: string,
    passengerId?: string
  ): TravelDocument {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const categoryTitleMap: Record<DocumentCategory, string> = {
      flight: `כרטיס טיסה ${ocrResult.flightNumber ? `(${ocrResult.flightNumber})` : ''}`,
      hotel: 'אישור הזמנת מלון',
      car_rental: 'שובר השכרת רכב',
      insurance: 'פוליסת ביטוח נסיעות',
      train: 'כרטיס רכבת',
      passport: 'מסמך זיהוי / דרכון',
      custom: fileName,
    };

    return {
      id: docId,
      tripId,
      passengerId,
      title: categoryTitleMap[ocrResult.category] || fileName,
      category: ocrResult.category,
      localFilePath: filePath,
      mimeType: filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      trigger: {
        type: ocrResult.category === 'flight' ? 'flight_phase' : 'time',
        isActive: true,
      },
      isArchived: false,
      createdAt: new Date().toISOString(),
      source: 'auto_file_scan',
    };
  }

  /**
   * הדמיית חילוץ טקסט מקומי משכבת קובץ/תמונה (מוכן לחיבור מודול C++/ML Kit במכשיר)
   */
  private static async extractTextFromPath(filePath: string): Promise<string> {
    const lowerName = filePath.toLowerCase();

    if (lowerName.includes('flight') || lowerName.includes('boarding') || lowerName.includes('ticket')) {
      return `BOARDING PASS\nPASSENGER: NACHMAN HASSON\nFLIGHT: LY385 TLV TO FCO\nDATE: 15/10/2026\nPNR: ABC123\nSEAT: 27E\nGATE: B22`;
    }

    if (lowerName.includes('hotel') || lowerName.includes('booking')) {
      return `HOTEL RESERVATION CONFIRMATION\nRome Marriott Hotel\nCheck-in: 15/10/2026 Check-out: 22/10/2026\nGuest: Nachman Hasson\nAddress: Via Veneto 125, Rome`;
    }

    if (lowerName.includes('car') || lowerName.includes('rental') || lowerName.includes('avis')) {
      return `CAR RENTAL AGREEMENT\nAVIS RENT A CAR\nPick-up: FCO Airport 15/10/2026\nDrop-off: 22/10/2026\nDriver: Nachman Hasson`;
    }

    if (lowerName.includes('insurance') || lowerName.includes('passportcard') || lowerName.includes('harel')) {
      return `TRAVEL INSURANCE POLICY\nPassportCard Medical Coverage\nValid: 15/10/2026 - 25/10/2026\nInsured: Nachman Hasson`;
    }

    return `SCANNED DOCUMENT ${filePath}`;
  }

  /**
   * חילוץ תאריכים מתוך הטקסט (תבניות DD/MM/YYYY, YYYY-MM-DD וכו')
   */
  private static extractDates(text: string): Date[] {
    const dates: Date[] = [];
    const dateRegex = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g;
    let match;

    while ((match = dateRegex.exec(text)) !== null) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      let year = parseInt(match[3], 10);
      if (year < 100) year += 2000;

      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        dates.push(parsed);
      }
    }

    return dates;
  }

  /**
   * חילוץ מספר טיסה (2-3 אותיות של חברת תעופה + 1-4 ספרות)
   */
  private static extractFlightNumber(text: string): string | undefined {
    const flightRegex = /\b([A-Z]{2}|[A-Z][0-9]|[0-9][A-Z])\s?([0-9]{1,4})\b/;
    const match = text.match(flightRegex);
    return match ? `${match[1]}${match[2]}` : undefined;
  }

  /**
   * חילוץ קוד הזמנה PNR (רצף של 6 תווים אלפאנומריים באותיות גדולות)
   */
  private static extractPNR(text: string): string | undefined {
    const pnrRegex = /\b(?:PNR|BOOKING|CONFIRMATION|RECORD LOCATOR)[:\s]+([A-Z0-9]{6})\b/i;
    const match = text.match(pnrRegex);
    return match ? match[1].toUpperCase() : undefined;
  }

  /**
   * חילוץ שם נוסע
   */
  private static extractPassengerName(text: string): string | undefined {
    const nameRegex = /\b(?:PASSENGER|GUEST|NAME|INSURED)[:\s]+([A-Za-z\s]{3,30})\b/i;
    const match = text.match(nameRegex);
    return match ? match[1].trim() : undefined;
  }
}
