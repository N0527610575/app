/**
 * @file ManualUploadHandler.ts
 * @description
 * מנהל את העלאת המסמכים הידנית על ידי המשתמש (Manual Ingestion).
 * תומך בשני ערוצים מרכזיים: צילום מסמך במצלמה (למשל דרכון או כרטיס מודפס),
 * ובחירת קובץ מסייר הקבצים של המכשיר (PDF או תמונה).
 * הקובץ מעתיק את המסמך לסביבה המקומית המאובטחת של האפליקציה ומכין אותו לעיבוד.
 */

import { DocumentCategory } from '../../core/types/Document';

// ייבוא דמה של ספריות Native נפוצות ב-React Native
// import DocumentPicker from 'react-native-document-picker';
// import { launchCamera } from 'react-native-image-picker';
// import * as FileSystem from 'react-native-fs';

export interface ManualUploadResult {
  localFilePath: string;
  fileName: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  userSuggestedCategory?: DocumentCategory; // אם המשתמש בחר קטגוריה באופן ידני בזמן ההעלאה
}

export class ManualUploadHandler {

  /**
   * פתיחת מצלמת המכשיר לצילום מסמך מודפס
   * @param category (אופציונלי) קטגוריה שהמשתמש בחר מראש (למשל: "צלם דרכון")
   */
  public static async captureFromCamera(category?: DocumentCategory): Promise<ManualUploadResult | null> {
    try {
      console.log("[ManualUploadHandler] פותח מצלמה לצילום מסמך...");

      // הלוגיקה בפועל תשתמש ב-launchCamera מתוך react-native-image-picker
      /*
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || !result.assets) return null;
      const photo = result.assets[0];
      */

      // הדמיית התוצאה
      const mockPhotoPath = "file:///data/user/0/com.travelapp/cache/camera_image.jpg";

      return {
        localFilePath: mockPhotoPath,
        fileName: "camera_image.jpg",
        mimeType: 'image/jpeg',
        userSuggestedCategory: category
      };

    } catch (error) {
      console.error("[ManualUploadHandler] שגיאה בהפעלת המצלמה:", error);
      return null;
    }
  }

  /**
   * פתיחת סייר הקבצים לבחירת קובץ מתוך המכשיר (PDF או תמונה)
   */
  public static async pickFileFromDevice(): Promise<ManualUploadResult | null> {
    try {
      console.log("[ManualUploadHandler] פותח סייר קבצים...");

      // הלוגיקה בפועל תשתמש ב-DocumentPicker.pick
      /*
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
      */

      // הדמיית התוצאה
      const mockFilePath = "content://com.android.providers.downloads.documents/document/ticket.pdf";

      return {
        localFilePath: mockFilePath,
        fileName: "ticket.pdf",
        mimeType: 'application/pdf',
        // כאן הקטגוריה תהיה ריקה, ונשאיר למנוע ה-OCR והברקודים להבין לבד מה זה
      };

    } catch (error) {
      // אם המשתמש ביטל את בחירת הקובץ
      // if (DocumentPicker.isCancel(error)) return null;
      console.error("[ManualUploadHandler] שגיאה בבחירת קובץ:", error);
      return null;
    }
  }

  /**
   * העתקת הקובץ לתיקייה פנימית ומאובטחת של האפליקציה (Vault)
   * כדי שלא יימחק אם המשתמש מנקה את תיקיית ההורדות בטלפון
   */
  public static async secureFileInVault(uploadResult: ManualUploadResult): Promise<string> {
    // הלוגיקה תשתמש ב-FileSystem.copyFile
    const vaultPath = `file:///data/user/0/com.travelapp/files/vault/${uploadResult.fileName}`;
    console.log(`[ManualUploadHandler] שומר עותק מאובטח בכספת המקומית: ${vaultPath}`);

    return vaultPath;
  }
}