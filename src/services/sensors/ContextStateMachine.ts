/**
 * @file ContextStateMachine.ts
 * @description
 * מכונת המצבים החכמה של האפליקציה (Context State Machine).
 * מחשבת בזמן אמת באיזה שלב במסע המשתמש נמצא, על סמך אינטגרציה של:
 * שעון (זמן לטיסה), GPS (הגעה לשדה), וברומטר/מד תאוצה (המראה ונחיתה).
 * היא זו שמעדכנת את מצב ה-UI (הקפצת ברקודים, שינוי טקסטים).
 */

import { ContextState, TravelPhase } from '../../core/types/ContextState';
import { Trip } from '../../core/types/Trip';
import { AppConfig } from '../../core/constants/AppConfig';

export interface SensorDataInput {
  isAtAirport: boolean;           // התקבל מחיישן ה-GPS / Geofence
  minutesToDeparture: number;     // חישוב של זמן נוכחי מול שעת ההמראה
  isPressureDropped: boolean;     // התקבל מחיישן הברומטר (מעיד על המראה)
  isWalking: boolean;             // התקבל ממד התאוצה (תנועה בשרוול או עצירה במקום)
}

export class ContextStateMachine {
  // המצב הנוכחי של האפליקציה (נשמר בזיכרון)
  private currentState: ContextState;

  constructor(initialTripId?: string) {
    this.currentState = {
      currentPhase: 'IDLE_PRE_TRIP',
      activeTripId: initialTripId,
      isBarcodeHeroVisible: false,
      isMoving: false
    };
  }

  /**
   * הפונקציה המרכזית שרצה כל כמה שניות (או כשחיישן מעדכן נתון),
   * מעבדת את הנתונים ומחליטה אם צריך לעבור לשלב הבא במסע.
   */
  public evaluateState(sensors: SensorDataInput, activeTrip: Trip): ContextState {
    const previousPhase = this.currentState.currentPhase;
    let nextPhase = previousPhase;

    // לוגיקת מעברי המצבים (State Transitions)

    if (sensors.isPressureDropped) {
      // אם הלחץ הברומטרי ירד דרסטית - אנחנו בוודאות באוויר (דיחוס תא נוסעים)
      nextPhase = 'IN_FLIGHT';
    }
    else if (previousPhase === 'IN_FLIGHT' && !sensors.isPressureDropped) {
      // אם היינו באוויר ועכשיו הלחץ חזר לרגיל - נחתנו
      nextPhase = 'LANDED_AT_DESTINATION';
    }
    else if (sensors.isAtAirport) {
      // המשתמש נמצא בתוך שדה התעופה
      if (sensors.minutesToDeparture <= AppConfig.timing.showBoardingPassMinutesBefore && sensors.minutesToDeparture > 0) {
        // הגיע הזמן לבורדינג!
        nextPhase = 'BOARDING_GATE';
      }
      else if (sensors.minutesToDeparture <= 0 && !sensors.isWalking) {
        // עבר זמן ההמראה והמשתמש יושב - הוא כנראה מחפש את המושב או כבר התיישב
        nextPhase = 'FINDING_SEAT';
      }
      else {
        // נמצא בשדה אבל עדיין מוקדם לבורדינג
        nextPhase = 'AT_DEPARTURE_AIRPORT';
      }
    }
    else {
      // לא בשדה ולא באוויר - מצב המתנה רגיל
      nextPhase = 'IDLE_PRE_TRIP';
    }

    // אם המצב השתנה, נעדכן את התצוגה (UI Helpers)
    if (nextPhase !== previousPhase) {
      console.log(`[ContextStateMachine] שינוי מצב: ${previousPhase} ➔ ${nextPhase}`);
      this.applyUIHelpers(nextPhase);
    }

    this.currentState.currentPhase = nextPhase;
    this.currentState.isMoving = sensors.isWalking;

    return this.currentState;
  }

  /**
   * מתאים את המסך למצב החדש (מה להציג בענק ואיזה טקסט עזר להקפיץ)
   */
  private applyUIHelpers(newPhase: TravelPhase) {
    switch (newPhase) {
      case 'BOARDING_GATE':
        this.currentState.isBarcodeHeroVisible = true;
        this.currentState.toastMessage = "שער העלייה נפתח. נא להכין דרכונים וכרטיסים פתוחים.";
        break;
      case 'FINDING_SEAT':
        this.currentState.isBarcodeHeroVisible = false; // מסתירים את הברקוד
        this.currentState.toastMessage = "טיסה נעימה. מספר המושב שלך מוצג על המסך.";
        break;
      case 'IN_FLIGHT':
        this.currentState.isBarcodeHeroVisible = false;
        this.currentState.toastMessage = "מצב טיסה פעיל. נעדכן אותך בנחיתה.";
        break;
      case 'LANDED_AT_DESTINATION':
        this.currentState.isBarcodeHeroVisible = false;
        this.currentState.toastMessage = "ברוכים הבאים ליעד! לחץ כאן להוראות הגעה מפורטות.";
        break;
      default:
        this.currentState.isBarcodeHeroVisible = false;
        this.currentState.toastMessage = undefined;
    }
  }
}