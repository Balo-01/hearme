const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const DEFAULT_PATIENT_ID = '1d604da9-9a81-4ba9-80c2-de3375d59b40';

export async function getActiveRequests() {
  // Returns all requests (active + dismissed) for displaying complete history
  const response = await fetch(`${API_BASE_URL}/requests`);

  if (!response.ok) {
    throw new Error(`Failed to load requests (${response.status})`);
  }

  return response.json();
}

export async function createRequest(patientId, path) {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      path: Array.isArray(path) ? path : [path],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create request (${response.status})`);
  }

  return response.json();
}

export async function getRecommendations(patientId, category) {
  const params = new URLSearchParams({
    patient_id: patientId,
    category,
  });

  const response = await fetch(`${API_BASE_URL}/recommendations?${params.toString()}`);

  if (!response.ok) {
    let detail = '';

    try {
      const body = await response.json();
      if (body?.detail) {
        detail = `: ${body.detail}`;
      }
    } catch {
      // Ignore non-JSON error bodies and keep the status-focused error.
    }

    throw new Error(`Failed to load recommendations (${response.status})${detail}`);
  }

  return response.json();
}

export async function dismissRequest(requestId) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/dismiss`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to dismiss request (${response.status})`);
  }

  return response.json();
}
