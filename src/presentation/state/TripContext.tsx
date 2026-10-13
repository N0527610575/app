import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ContextState } from '../../core/types/ContextState';
import { Trip } from '../../core/types/Trip';
import { TravelDocument } from '../../core/types/Document';
import { DatabaseService } from '../../core/database/DatabaseService';
import { ContextStateMachine } from '../../services/sensors/ContextStateMachine';
import { BarometerService } from '../../services/sensors/BarometerService';
import { MotionService } from '../../services/sensors/MotionService';
import { LocationService } from '../../services/sensors/LocationService';
import { DeepFileScanner } from '../../services/ingestion/DeepFileScanner';

interface TripContextType {
  contextState: ContextState;
  activeTrip: Trip | null;
  documents: TravelDocument[];
  setActivePassenger: (passengerId: string) => void;
  updatePhase: (phase: ContextState['currentPhase']) => void;
  addDocument: (doc: TravelDocument) => Promise<void>;
  scanFilesNow: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contextState, setContextState] = useState<ContextState>({
    currentPhase: 'BOARDING_GATE',
    isBarcodeHeroVisible: true,
    activePassengerId: 'pass_1',
    toastMessage: 'שער העלייה נפתח. נא להכין דרכונים וכרטיסים פתוחים.',
    isMoving: false,
  });

  const [activeTrip, setActiveTrip] = useState<Trip | null>({
    id: 'trip_rome',
    title: 'חופשה ברומא',
    isActive: true,
    anchor: { departureDate: '2026-10-15T10:00:00Z', scanWindowStartDate: '2025-10-15T00:00:00Z' },
    flights: [],
    passengers: [
      { id: 'pass_1', fullName: 'נחמן חסון', shortName: 'נחמן', isPrimaryUser: true, currentSeatNumber: '27E' },
      { id: 'pass_2', fullName: 'שולמית חיה', shortName: 'שולמית', isPrimaryUser: false, currentSeatNumber: '27F' }
    ],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [documents, setDocuments] = useState<TravelDocument[]>([]);

  // שירותי חיישנים ומכונת מצבים
  const stateMachineRef = useRef(new ContextStateMachine('trip_rome'));
  const barometerRef = useRef(new BarometerService());
  const motionRef = useRef(new MotionService());
  const locationRef = useRef(new LocationService());

  useEffect(() => {
    // אתחול מסד נתונים מוצפן מקומי וטעינת נתונים
    const initDatabaseAndSensors = async () => {
      try {
        await DatabaseService.init();
        const storedTrip = await DatabaseService.getActiveTrip();
        if (storedTrip) {
          setActiveTrip(storedTrip);
          const storedDocs = await DatabaseService.getDocumentsByTrip(storedTrip.id);
          setDocuments(storedDocs);
        } else if (activeTrip) {
          await DatabaseService.saveTrip(activeTrip);
        }

        // הפעלת ניטור חיישנים במכשיר
        await barometerRef.current.startMonitoring();
        await motionRef.current.startMonitoring();
        await locationRef.current.requestPermissions();
      } catch (err) {
        console.warn('[TripContext] אתחול שירותים מקומיים הושלם עם הערות:', err);
      }
    };

    initDatabaseAndSensors();

    return () => {
      barometerRef.current.stopMonitoring();
      motionRef.current.stopMonitoring();
      locationRef.current.stopGeofencing();
    };
  }, []);

  const setActivePassenger = (passengerId: string) => {
    setContextState(prev => ({ ...prev, activePassengerId: passengerId }));
  };

  const updatePhase = (phase: ContextState['currentPhase']) => {
    setContextState(prev => ({ ...prev, currentPhase: phase }));
  };

  const addDocument = async (doc: TravelDocument) => {
    await DatabaseService.saveDocument(doc);
    setDocuments(prev => [...prev, doc]);
  };

  const scanFilesNow = async () => {
    if (!activeTrip) return;
    try {
      const newDocs = await DeepFileScanner.processAndIngestFiles(activeTrip.id, activeTrip.anchor);
      if (newDocs.length > 0) {
        setDocuments(prev => [...prev, ...newDocs]);
      }
    } catch (err) {
      console.error('[TripContext] שגיאה בסריקת קבצים:', err);
    }
  };

  return (
    <TripContext.Provider
      value={{
        contextState,
        activeTrip,
        documents,
        setActivePassenger,
        updatePhase,
        addDocument,
        scanFilesNow
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTravelContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTravelContext must be used within a TripProvider');
  }
  return context;
};
