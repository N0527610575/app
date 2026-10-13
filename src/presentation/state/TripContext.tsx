import React, { createContext, useContext, useState } from 'react';
import { ContextState } from '../../core/types/ContextState';
import { Trip } from '../../core/types/Trip';
import { TravelDocument } from '../../core/types/Document';

interface TripContextType {
  contextState: ContextState;
  activeTrip: Trip | null;
  documents: TravelDocument[];
  setActivePassenger: (passengerId: string) => void;
  updatePhase: (phase: ContextState['currentPhase']) => void;
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

  const setActivePassenger = (passengerId: string) => {
    setContextState(prev => ({ ...prev, activePassengerId: passengerId }));
  };

  const updatePhase = (phase: ContextState['currentPhase']) => {
    setContextState(prev => ({ ...prev, currentPhase: phase }));
  };

  return (
    <TripContext.Provider value={{ contextState, activeTrip, documents, setActivePassenger, updatePhase }}>
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
