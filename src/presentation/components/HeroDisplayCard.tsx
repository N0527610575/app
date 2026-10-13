/**
 * @file HeroDisplayCard.tsx
 * @description
 * הרכיב המרכזי של האפליקציה - מציג את המידע הקריטי ביותר בכל רגע נתון.
 * מתאים את עצמו אוטומטית למכונת המצבים: מקפיץ את הברקוד בשערי העלייה למטוס,
 * ומחליף אותו למספר המושב כשהמשתמש בשרוול או במטוס.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import { ContextState } from '../../core/types/ContextState';
import { TravelDocument } from '../../core/types/Document';

interface HeroDisplayCardProps {
  context: ContextState;                 // המצב הנוכחי מהחיישנים ומכונת המצבים
  activeDocument: TravelDocument | null; // המסמך/כרטיס הטיסה הרלוונטי כרגע
}

export const HeroDisplayCard: React.FC<HeroDisplayCardProps> = ({ context, activeDocument }) => {

  // אם אין מסמך פעיל עדיין, נציג מצב ריק/המתנה
  if (!activeDocument) {
    return (
      <View style={[styles.cardContainer, styles.idleContainer]}>
        <Text style={styles.idleText}>אין מסמך פעיל כרגע</Text>
        <Text style={styles.subText}>המסמכים שלך יקפצו כאן אוטומטית מתי שתצטרך אותם.</Text>
      </View>
    );
  }

  const { isBarcodeHeroVisible, highlightedSeat } = context;

  return (
    <View style={styles.cardContainer}>

      {/* כותרת הכרטיס המציגה למי שייך המסמך */}
      <View style={styles.header}>
        <Text style={styles.titleText}>{activeDocument.title}</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* מצב 1: האפליקציה דורשת להציג את הברקוד בגדול (למשל בזמן הבורדינג) */}
        {isBarcodeHeroVisible && activeDocument.barcode ? (
          <View style={styles.barcodeSection}>
            <Text style={styles.instructionText}>הצג לסריקה</Text>

            <View style={styles.barcodePlaceholder}>
              <QRCode
                value={activeDocument.barcode.rawData || 'SMART-TRAVEL-BOARDING-PASS'}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
          </View>
        ) :

        /* מצב 2: יש מושב מודגש (למשל אחרי הסריקה בשער ובתוך המטוס) */
        highlightedSeat ? (
          <View style={styles.seatSection}>
            <Text style={styles.instructionText}>המושב שלך</Text>
            <Text style={styles.hugeSeatNumber}>{highlightedSeat}</Text>
          </View>
        ) :

        /* מצב 3: חלופת מחדל - מציג מידע כללי או תמונה */
        (
          <View style={styles.defaultSection}>
            <Text style={styles.infoText}>המסמך שמור ומוכן לשימוש.</Text>
          </View>
        )}
      </View>

    </View>
  );
};

// =========================================================================
// עיצוב הרכיב (Styles) - דגש על קריאות גבוהה, טקסטים ענקיים וניקיון ויזואלי
// =========================================================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  cardContainer: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignSelf: 'center',
    // יצירת צל עדין מתחת לכרטיס
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 20,
  },
  idleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    minHeight: 200,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
  barcodeSection: {
    alignItems: 'center',
  },
  seatSection: {
    alignItems: 'center',
  },
  defaultSection: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hugeSeatNumber: {
    fontSize: 90,             // ענק כדי שאפשר יהיה לקרוא גם בחושך או ממרחק
    fontWeight: '900',
    color: '#007AFF',         // צבע כחול בולט
    letterSpacing: 2,
  },
  barcodePlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  placeholderText: {
    color: '#CCCCCC',
    fontSize: 18,
  },
  idleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999999',
  },
  subText: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#555555',
  }
});