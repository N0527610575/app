/**
 * @file MainCompanionScreen.tsx
 * @description
 * המסך הראשי של האפליקציה (The Main Hub).
 * מסך זה מאגד את כל רכיבי התצוגה (Hero Card, Tabs, Modal) ומזרים אליהם
 * את הנתונים בזמן אמת מתוך מכונת המצבים המרכזית (Context State Machine).
 * הוא תוכנן להיות נקי, ברור, וממוקד רק במידע הרלוונטי לשנייה זו.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, Animated } from 'react-native';

// ייבוא הרכיבים שבנינו קודם
import { HeroDisplayCard } from '../components/HeroDisplayCard';
import { PassengerTabBar } from '../components/PassengerTabBar';
import { WayfindingModal } from '../components/WayfindingModal';

// ייבוא הטיפוסים
import { ContextState } from '../../core/types/ContextState';
import { Trip } from '../../core/types/Trip';
import { TravelDocument } from '../../core/types/Document';

/**
 * הערה: במערכת אמיתית נייבא כאן Hook גלובלי (כמו Redux או Context API)
 * שמספק את המידע החי מהחיישנים ומהדאטה-בייס. לצורך ההדגמה, נגדיר את המבנה.
 */
import { useTravelContext } from '../state/TripContext';

export const MainCompanionScreen: React.FC = () => {
  // === חיבור למצב הגלובלי מתוך ה-Context ===
  const { contextState, activeTrip, setActivePassenger } = useTravelContext();

  // אנימציה עדינה להופעת הודעת ה-Toast העליונה
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (contextState.toastMessage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [contextState.toastMessage]);

  const currentPassenger = useMemo(() => {
    return activeTrip?.passengers.find(p => p.id === contextState.activePassengerId) || activeTrip?.passengers[0];
  }, [activeTrip?.passengers, contextState.activePassengerId]);

  const activeDocument = useMemo<TravelDocument | null>(() => {
    if (!currentPassenger) return null;
    return {
      id: `doc_${currentPassenger.id}`,
      tripId: activeTrip?.id || 'trip_rome',
      passengerId: currentPassenger.id,
      title: `כרטיס עלייה למטוס - ${currentPassenger.shortName}`,
      category: 'flight',
      localFilePath: 'file://...',
      mimeType: 'application/pdf',
      barcode: {
        format: 'PDF417',
        rawData: `M1${currentPassenger.fullName.toUpperCase().replace(/\s+/g, '/')}/E...`,
        passengerName: currentPassenger.fullName,
        seatNumber: currentPassenger.currentSeatNumber,
      },
      trigger: { type: 'flight_phase', isActive: true },
      isArchived: false,
      createdAt: new Date().toISOString(),
      source: 'auto_file_scan'
    };
  }, [currentPassenger, activeTrip?.id]);

  const hotelTarget = useMemo(() => ({
    type: 'hotel' as const,
    name: 'Rome Marriott Hotel',
    address: 'Via Veneto 125, Rome, Italy',
  }), []);

  // === מטפל באירועים ===
  const handlePassengerChange = (passengerId: string) => {
    setActivePassenger(passengerId);
  };

  // === רינדור המסך ===
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      <View style={styles.mainContainer}>

        {/* אזור 1: בועת התראות מערכת / Toast (למשל: "הכן דרכון") */}
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          {contextState.toastMessage && (
            <Text style={styles.toastText}>{contextState.toastMessage}</Text>
          )}
        </Animated.View>

        <View style={styles.contentWrapper}>

          {/* אזור 2: ה"גיבור" המרכזי - הברקוד הענק או מספר המושב */}
          <HeroDisplayCard
            context={{
              ...contextState,
              highlightedSeat: currentPassenger?.currentSeatNumber,
            }}
            activeDocument={activeDocument}
          />

          {/* אזור 3: סרגל הנוסעים (יופיע רק אם יש יותר מנוסע אחד) */}
          {activeTrip?.passengers && (
            <PassengerTabBar
              passengers={activeTrip.passengers}
              activePassengerId={contextState.activePassengerId}
              onPassengerSelect={handlePassengerChange}
            />
          )}

        </View>

        {/* אזור 4: כפתור ניווט קופץ - יופיע רק בנחיתה ביעד */}
        <View style={styles.bottomArea}>
          <WayfindingModal
            currentPhase={contextState.currentPhase}
            target={hotelTarget}
          />
        </View>

      </View>
    </SafeAreaView>
  );
};

// =========================================================================
// עיצוב המסך (Styles) - סביבה נקייה, מינימליסטית, רקע אפור בהיר להבלטת הכרטיסים
// =========================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7', // אפור בהיר בסגנון iOS לשמירה על נראות נקייה
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between', // מפזר את התוכן על פני המסך (למעלה, אמצע, למטה)
  },
  toastContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    minHeight: 50, // שומר על המקום כדי שהמסך לא "יקפוץ" כשההודעה מופיעה
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center', // ממכז את הכרטיס והטאבים בדיוק באמצע המסך
  },
  bottomArea: {
    paddingBottom: 20,
    minHeight: 80, // שומר מקום לכפתור הניווט (Wayfinding) שאולי יצוץ בנחיתה
  }
});