import { createContext, useContext, useState } from 'react';

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const [patientId, setPatientId] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  return (
    <PatientContext.Provider value={{ patientId, setPatientId, aiSummary, setAiSummary }}>
      {children}
    </PatientContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within PatientProvider');
  }
  return context;
}
