import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getActiveRequests, createRequest, dismissRequest as dismissRequestApi } from '../services/requestsApi';

const RequestsContext = createContext(null);

// Builds the AI-rephrased version of a patient request shown on the nurse dashboard.
// Uses the request category (source) and the original request text.
const buildAiRephrasedRequest = (requestText, source) => {
  const normalizedSource = String(source || 'general').toLowerCase();
  return `The patient submitted a ${normalizedSource} request: ${requestText}. Please review and provide the appropriate support.`;
};

// Placeholder for patient history until AI integration is implemented.
const buildPatientHistory = () => [
  'No backend history is linked yet.',
  'This item is generated locally for UI preview.',
  'Future version: patient-specific history from backend + AI context.',
];

// Maps a raw backend request object to the shape expected by the UI.
// `source` and `requestText` are optional — used when creating a new request locally
// before re-fetching from backend (optimistic update).
const mapBackendRequest = (backendReq, source, requestText) => {
  const createdDate = new Date(backendReq.created_at);
  const path = Array.isArray(backendReq.path) ? backendReq.path : [];
  const category = source || (path.length > 0 ? path[0].toLowerCase() : 'general');

  // Use passed requestText, or derive from path
  // For pain: show "location pain - intensity" (e.g., "stomach pain - unbearable")
  const rawRequest = requestText || (
    category === 'emergency'
      ? 'Emergency assistance needed'
      : category === 'pain' && path.length === 3
        ? `${path[1]} pain - ${path[2]}`
        : path.length > 1
          ? path[path.length - 1]
          : category
  );

  return {
    id: String(backendReq.id),
    patient_id: backendReq.patient_id,
    path: path,
    status: backendReq.status,
    created_at: backendReq.created_at,
    createdAt: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    category: String(category).toLowerCase(),
    rawRequest: String(rawRequest).toLowerCase(),
    aiRephrasedRequest: buildAiRephrasedRequest(rawRequest, category),
    patientHistory: buildPatientHistory(),
  };
};

const POLLING_INTERVAL_MS = 5000;

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([]);

  // Fetches active requests from the backend on mount, then refreshes every POLLING_INTERVAL_MS.
  // This ensures the nurse dashboard reflects new patient requests without manual refresh.
  useEffect(() => {
    const loadActiveRequests = async () => {
      try {
        const activeRequests = await getActiveRequests();
        if (Array.isArray(activeRequests)) {
          setRequests(activeRequests.map((req) => mapBackendRequest(req)));
        }
      } catch (error) {
        console.error('Failed to load active requests from backend:', error);
      }
    };

    loadActiveRequests();
    const intervalId = setInterval(loadActiveRequests, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const value = useMemo(
    () => ({
      // The current list of active requests.
      requests,

      // Sends a new request to the backend and adds it to the local list immediately.
      // `patientId` is currently hardcoded as a fallback — should be replaced with dynamic patient identification.
      addRequest: async ({ source, request, path, patientId }) => {
        const backendRequest = await createRequest(
          patientId || '1d604da9-9a81-4ba9-80c2-de3375d59b40',
          path || [source]
        );
        const newRequest = mapBackendRequest(backendRequest, source, request);
        setRequests((prev) => [newRequest, ...prev]);
      },
      // Marks a request as resolved on the backend and removes it from the local list.
      // Resolved requests are kept in the database for future AI recommendation context.
      dismissRequest: async (requestId) => {
        await dismissRequestApi(requestId);
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
      },
    }),
    [requests]
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useRequests() {
  const context = useContext(RequestsContext);

  if (!context) {
    throw new Error('useRequests must be used inside RequestsProvider');
  }

  return context;
}
