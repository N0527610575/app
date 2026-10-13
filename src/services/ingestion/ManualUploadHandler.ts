/**
 * @file ManualUploadHandler.ts
 * @description
 * מנהל את העלאת המסמכים הידנית על ידי המשתמש (Manual Ingestion).
 * תומך בשני ערוצים מרכזיים: צילום מסמך במצלמה (למשל דרכון או כרטיס מודפס),
 * ובחירת קובץ מסייר הקבצים של המכשיר (PDF או תמונה).
 * הקובץ מעתיק את המסמך לסביבה המקומית המאובטחת של האפליקציה ומכין אותו לעיבוד.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { DocumentCategory, TravelDocument } from '../../core/types/Document';
import { LocalOCREngine } from '../processing/LocalOCREngine';
import { DatabaseService } from '../../core/database/DatabaseService';

export interface ManualUploadResult {
  localFilePath: string;
  fileName: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | string;
  userSuggestedCategory?: DocumentCategory; // אם המשתמש בחר קטגוריה באופן ידני בזמן ההעלאה
}

export class ManualUploadHandler {

  /**
   * פתיחת סייר הקבצים לבחירת קובץ מתוך המכשיר (PDF או תמונה)
   */
  public static async pickFileFromDevice(): Promise<ManualUploadResult | null> {
    try {
      console.log("[ManualUploadHandler] פותח סייר קבצים דרך expo-document-picker...");

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("[ManualUploadHandler] בחירת הקובץ בוטלה על ידי המשתמש.");
        return null;
      }

      const asset = result.assets[0];
      return {
        localFilePath: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType || 'application/pdf',
      };
    } catch (error) {
      console.error("[ManualUploadHandler] שגיאה בבחירת קובץ:", error);
      return null;
    }
  }

  /**
   * העתקת הקובץ לתיקייה פנימית ומאובטחת של האפליקציה (Vault)
   * כדי שלא יימחק אם המשתמש מנקה את תיקיית ההורדות בטלפון
   */
  public static async secureFileInVault(uploadResult: ManualUploadResult): Promise<string> {
    try {
      const docDir = FileSystem.documentDirectory;
      if (!docDir) throw new Error("תיקיית המסמכים אינה זמינה במכשיר.");

      const vaultDir = `${docDir}vault/`;
      const dirInfo = await FileSystem.getInfoAsync(vaultDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(vaultDir, { intermediates: true });
      }

      const safeFileName = `${Date.now()}_${uploadResult.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const destinationPath = `${vaultDir}${safeFileName}`;

      await FileSystem.copyAsync({
        from: uploadResult.localFilePath,
        to: destinationPath,
      });

      console.log(`[ManualUploadHandler] שומר עותק מאובטח בכספת המקומית: ${destinationPath}`);
      return destinationPath;
    } catch (error) {
      console.error("[ManualUploadHandler] שגיאה בשמירת קובץ בכספת:", error);
      return uploadResult.localFilePath;
    }
  }

  /**
   * עיבוד מלא של מסמך שהועלה: שמירה בכספת, פענוח ב-OCR מקומי ושמירה ב-Database
   */
  public static async processUploadedDocument(
    tripId: string,
    uploadResult: ManualUploadResult,
    passengerId?: string
  ): Promise<TravelDocument> {
    const vaultPath = await this.secureFileInVault(uploadResult);
    const ocrResult = await LocalOCREngine.recognizeTextLocally(vaultPath);

    if (uploadResult.userSuggestedCategory) {
      ocrResult.category = uploadResult.userSuggestedCategory;
    }

    const doc = LocalOCREngine.createDocumentFromOCR(
      tripId,
      vaultPath,
      ocrResult,
      uploadResult.fileName,
      passengerId
    );

    await DatabaseService.saveDocument(doc);
    return doc;
  }

  /**
   * פתיחת מצלמת המכשיר לצילום מסמך מודפס (Fallback עבור מודול מצלמה Native)
   * @param category (אופציונלי) קטגוריה שהמשתמש בחר מראש (למשל: "צלם דרכון")
   */
  public static async captureFromCamera(category?: DocumentCategory): Promise<ManualUploadResult | null> {
    console.log("[ManualUploadHandler] מצלמה דורשת מודול expo-camera או בחירת קובץ.");
    return null;
  }
}