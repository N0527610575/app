/**
 * @file PassengerTabBar.tsx
 * @description
 * רכיב ניווט מהיר בין נוסעים (Tab Bar).
 * נועד למנוע לחץ בזמן סריקת הכרטיסים בשער העלייה למטוס.
 * הרכיב מציג סרגל אופקי עם השמות הקצרים של כל הנוסעים המקושרים לאותה נסיעה.
 * לחיצה על טאב מעדכנת את הנוסע הפעיל, ומשנה מיידית את הברקוד שמוצג במסך המרכזי.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Passenger } from '../../core/types/Passenger';

interface PassengerTabBarProps {
  passengers: Passenger[];              // רשימת כל הנוסעים בנסיעה הזו
  activePassengerId: string | undefined; // המזהה של הנוסע שכרטיסו מוצג כעת במסך
  onPassengerSelect: (passengerId: string) => void; // הפעולה שתרוץ בעת לחיצה על טאב
}

export const PassengerTabBar: React.FC<PassengerTabBarProps> = ({
  passengers,
  activePassengerId,
  onPassengerSelect
}) => {

  // אם יש רק נוסע אחד או שאין נוסעים, אין טעם להציג את סרגל המעבר
  if (!passengers || passengers.length <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/*
        אנו משתמשים ב-ScrollView אופקי כדי לתמוך במצב של משפחות גדולות.
        showsHorizontalScrollIndicator={false} מעלים את פס הגלילה למראה נקי.
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {passengers.map((passenger) => {
          // בדיקה האם הטאב הנוכחי הוא הטאב שנבחר כרגע
          const isActive = passenger.id === activePassengerId;

          return (
            <TouchableOpacity
              key={passenger.id}
              onPress={() => onPassengerSelect(passenger.id)}
              style={[
                styles.tabButton,
                isActive ? styles.activeTabButton : styles.inactiveTabButton
              ]}
              activeOpacity={0.7} // אפקט עמעום קל בעת לחיצה
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.activeTabText : styles.inactiveTabText
                ]}
              >
                {passenger.shortName}
              </Text>

              {/* סמן ויזואלי קטן לנוסע הראשי (אופציונלי) */}
              {passenger.isPrimaryUser && (
                <View style={styles.primaryIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// =========================================================================
// עיצוב הרכיב (Styles) - כפתורים עגולים, גדולים ונוחים ללחיצה ביד אחת
// =========================================================================

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: '100%',
    marginVertical: 10,
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12, // מרווח בין הטאבים (דורש React Native מעודכן, אחרת משתמשים ב-marginRight)
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30, // כפתור בצורת "גלולה"
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // צל קל לכפתורים
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTabButton: {
    backgroundColor: '#007AFF', // כחול בולט לטאב הפעיל
  },
  inactiveTabButton: {
    backgroundColor: '#FFFFFF', // לבן לטאבים שלא נבחרו
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inactiveTabText: {
    color: '#555555',
  },
  primaryIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964', // נקודה ירוקה
    marginLeft: 6,
  }
});