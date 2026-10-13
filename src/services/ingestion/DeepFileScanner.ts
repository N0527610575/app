/**
 * @file DeepFileScanner.ts
 * @description
 * מנוע סריקת קבצים מקומית (On-Device Local File Scanner).
 * המנוע סורק את תיקיות המסמכים של המכשיר בטווח זמנים מוגדר (עד שנה אחורה).
 * הוא מאתר קבצים פוטנציאליים (PDF/תמונות) ומסנן אותם לפי חלון הזמן של עוגן הטיסה.
 */

import * as FileSystem from 'expo-file-system';
import { AppConfig } from '../../core/constants/AppConfig';
import { TripAnchor } from '../../core/types/Trip';

export interface ScannedFile {
  filePath: string;
  fileName: string;
  creationDate: Date;
  fileExtension: string;
}

export class DeepFileScanner {
  /**
   * הפונקציה המרכזית שמתחילה את הסריקה לאחור בהתבסס על עוגן הטיסה
   * @param anchor עוגן הטיול (מכיל את תאריך תחילת חלון הסריקה)
   * @returns רשימה של קבצים פוטנציאליים שנמצאו בטווח הזמן
   */
  public static async scanRetroactively(anchor: TripAnchor): Promise<ScannedFile[]> {
    try {
      console.log(`[DeepFileScanner] מתחיל סריקה עמוקה החל מ: ${anchor.scanWindowStartDate}`);

      const scanStartDate = new Date(anchor.scanWindowStartDate);
      const potentialFiles: ScannedFile[] = [];

      // הגדרת תיקיית המסמכים של האפליקציה
      const docDir = FileSystem.documentDirectory;
      if (!docDir) return [];

      const fileNames = await FileSystem.readDirectoryAsync(docDir);

      for (const fileName of fileNames) {
        const fileExtension = this.getFileExtension(fileName);

        if (AppConfig.scanning.allowedFileExtensions.includes(fileExtension.toLowerCase())) {
          const filePath = `${docDir}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists) {
            const modificationTime = fileInfo.modificationTime
              ? new Date(fileInfo.modificationTime * 1000)
              : new Date();

            if (modificationTime >= scanStartDate) {
              potentialFiles.push({
                filePath,
                fileName,
                creationDate: modificationTime,
                fileExtension,
              });
            }
          }
        }
      }

      console.log(`[DeepFileScanner] נמצאו ${potentialFiles.length} קבצים פוטנציאליים.`);
      return potentialFiles;
    } catch (error) {
      console.error('[DeepFileScanner] שגיאה במהלך סריקת הקבצים:', error);
      return [];
    }
  }

  /**
   * פונקציית עזר לחילוץ סיומת הקובץ
   */
  private static getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    if (parts.length > 1) {
      return `.${parts[parts.length - 1]}`;
    }
    return '';
  }
}
