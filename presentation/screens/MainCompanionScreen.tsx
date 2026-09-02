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
// import { useTravelContext } from '../state/TripContext';

export const MainCompanionScreen: React.FC = () => {
  // === חיבור למצב הגלובלי (Mocking the Context) ===
  // const { contextState, activeTrip, documents, updateActivePassenger } = useTravelContext();

  // נתוני דמה שמדמים את מה שהיינו מקבלים מה-Context
  const [contextState, setContextState] = useState<ContextState>({
    currentPhase: 'BOARDING_GATE', // דוגמה: אנחנו בשלב הבורדינג
    isBarcodeHeroVisible: true,
    activePassengerId: 'pass_1',
    toastMessage: 'שער העלייה נפתח. נא להכין דרכונים וכרטיסים פתוחים.',
    isMoving: false,
  });

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

  // === בניית נתוני הדמה של המשפחה והמסמכים (בפועל יגיע מהדאטה-בייס) ===
  const activeTrip = useMemo<Trip | null>(() => ({
    id: 'trip_rome',
    title: 'חופשה ברומא',
    isActive: true,
    anchor: { departureDate: '2026-10-15T10:00:00Z', scanWindowStartDate: '2025-10-15T00:00:00Z' },
    flights: [], // הושמט לקיצור
    passengers: [
      { id: 'pass_1', fullName: 'נחמן חסון', shortName: 'נחמן', isPrimaryUser: true, currentSeatNumber: '27E' },
      { id: 'pass_2', fullName: 'שולמית חיה', shortName: 'שולמית', isPrimaryUser: false, currentSeatNumber: '27F' }
    ],
    documents: [],
    createdAt: '', updatedAt: ''
  }), []);

  const activeDocument = useMemo<TravelDocument | null>(() => ({
    id: 'doc_1',
    tripId: 'trip_rome',
    passengerId: contextState.activePassengerId, // מתעדכן לפי הלחיצה בטאבים
    title: `כרטיס עלייה למטוס - ${contextState.activePassengerId === 'pass_1' ? 'נחמן' : 'שולמית'}`,
    category: 'flight',
    localFilePath: 'file://...',
    mimeType: 'application/pdf',
    barcode: { format: 'PDF417', rawData: 'M1HASSON/NACHMAN...' },
    trigger: { type: 'flight_phase', isActive: true },
    isArchived: false, createdAt: '', source: 'auto_file_scan'
  }), [contextState.activePassengerId]);

  const hotelTarget = useMemo(() => ({
    type: 'hotel' as const,
    name: 'Rome Marriott Hotel',
    address: 'Via Veneto 125, Rome, Italy',
  }), []);


  // === מטפל באירועים ===
  const handlePassengerChange = (passengerId: string) => {
    // עדכון מזהה הנוסע הפעיל במערכת - ישנה את הברקוד המרכזי מיד
    setContextState(prev => ({ ...prev, activePassengerId: passengerId }));
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
            context={contextState}
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