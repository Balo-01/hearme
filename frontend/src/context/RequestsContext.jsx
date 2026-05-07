import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Shared requests context used by both patient flow and nurse dashboard.
const RequestsContext = createContext(null);
const STORAGE_KEY = 'hearme-requests';

// Loads previously saved local requests so UI survives page refresh.
const loadInitialRequests = () => {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const buildAiRephrasedRequest = (requestText, source) => {
  const normalizedSource = String(source || 'general').toLowerCase();
  return `The patient submitted a ${normalizedSource} request: ${requestText}. Please review and provide the appropriate support.`;
};

// Temporary mock history shown in Nurse details panel.
const buildPatientHistory = () => [
  'No backend history is linked yet.',
  'This item is generated locally for UI preview.',
  'Future version: patient-specific history from backend + AI context.',
];

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState(loadInitialRequests);

  // Persist every change so local demo data is not lost on refresh.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const value = useMemo(
    () => ({
      requests,
      setRequests,
      // Adds a new patient request when user confirms with "Yes".
      addRequest: ({ source, request }) => {
        const now = new Date();
        const requestText = String(request || 'Unknown request').toLowerCase();

        const newRequest = {
          id: `REQ-${Date.now()}`,
          patientLabel: 'Unknown patient',
          createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: String(source || 'general').toLowerCase(),
          rawRequest: requestText,
          aiRephrasedRequest: buildAiRephrasedRequest(requestText, source),
          patientHistory: buildPatientHistory(),
          isRead: false,
        };

        setRequests((previousRequests) => [newRequest, ...previousRequests]);
      },
    }),
    [requests]
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRequests() {
  const context = useContext(RequestsContext);

  // Guard to prevent accidental usage outside provider tree.
  if (!context) {
    throw new Error('useRequests must be used inside RequestsProvider');
  }

  return context;
}
