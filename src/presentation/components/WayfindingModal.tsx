/**
 * @file WayfindingModal.tsx
 * @description
 * רכיב התמצאות ביעד וניווט (Wayfinding & Navigation).
 * מופיע לאחר הנחיתה (LANDED_AT_DESTINATION) ומציע עזרה בהגעה למלון או חברת השכרת רכב.
 * מציג חלון קופץ (Modal) עם אפשרות לשגר את גוגל מפות היישר ליעד, בהתבסס
 * על נתונים שחולצו ממסמכים שאותרו קודם לכן במכשיר.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { NavigationService } from '../../services/external/NavigationService';
import { TravelPhase } from '../../core/types/ContextState';

interface WayfindingTarget {
  name: string;             // למשל: "Avis Car Rental" או "Rome Marriott Hotel"
  address?: string;         // כתובת שחולצה מהשובר
  latitude?: number;
  longitude?: number;
  type: 'hotel' | 'car_rental' | 'train';
}

interface WayfindingModalProps {
  currentPhase: TravelPhase;
  target?: WayfindingTarget; // היעד שאליו רוצים לנווט
}

export const WayfindingModal: React.FC<WayfindingModalProps> = ({ currentPhase, target }) => {
  const [isModalVisible, setModalVisible] = useState(false);

  // הרכיב יהיה זמין ויוצג רק כאשר אנחנו אחרי נחיתה או בסיום הטיול, ויש לנו יעד שאפשר לנווט אליו
  const isEligibleToShow = (currentPhase === 'LANDED_AT_DESTINATION' || currentPhase === 'POST_TRIP') && !!target;

  if (!isEligibleToShow || !target) {
    return null;
  }

  /**
   * פונקציה המפעילה את שירות הניווט החיצוני שלנו
   */
  const handleNavigatePress = async () => {
    if (target.latitude && target.longitude) {
      await NavigationService.navigateToCoordinates(target.latitude, target.longitude, target.name);
    } else if (target.address) {
      await NavigationService.navigateToAddress(target.address);
    }
    // סגירת המודאל לאחר הפעלת הניווט
    setModalVisible(false);
  };

  return (
    <>
      {/*
        כפתור הגישה הראשי - יופיע במסך לאחר הנחיתה.
        צבעים בולטים כדי לתפוס את תשומת הלב של משתמש מבולבל.
      */}
      <TouchableOpacity
        style={styles.triggerButton}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.triggerButtonText}>איך להגיע ליעד שלך?</Text>
      </TouchableOpacity>

      {/* החלון הקופץ עצמו שמפרט לאן הולכים */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)} // תמיכה בכפתור החזרה של אנדרואיד
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>ניווט ביעד</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.subTitle}>היעד הבא שלך:</Text>
              <Text style={styles.targetName}>{target.name}</Text>
              {target.address && (
                <Text style={styles.targetAddress}>{target.address}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.navigateButton}
              activeOpacity={0.8}
              onPress={handleNavigatePress}
            >
              <Text style={styles.navigateButtonText}>הפעל ניווט עכשיו (Google Maps)</Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// =========================================================================
// עיצוב הרכיב (Styles)
// =========================================================================

const styles = StyleSheet.create({
  // עיצוב כפתור ההפעלה הראשי
  triggerButton: {
    backgroundColor: '#34C759', // צבע ירוק המעודד פעולה
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  triggerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // עיצוב חלון המודאל (Modal)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // רקע חצי שקוף
    justifyContent: 'flex-end',            // החלון יופיע מתחתית המסך
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    minHeight: 250,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#888888',
  },
  infoContainer: {
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  subTitle: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 5,
  },
  targetName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  targetAddress: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});