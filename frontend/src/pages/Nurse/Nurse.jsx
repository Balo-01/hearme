import { useMemo, useState } from 'react';
import '../../App.css';
import { useRequests } from '../../context/RequestsContext.jsx';

export default function Nurse() {
  const { requests, dismissRequest } = useRequests();
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showPatientFilter, setShowPatientFilter] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [activePatientIdFilter, setActivePatientIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const normalizedActiveFilter = activePatientIdFilter.trim().toLowerCase();

  const sortedRequests = useMemo(() => {
    return [...requests].sort((left, right) => {
      // Active requests first
      if (left.status === "active" && right.status !== "active") return -1;
      if (left.status !== "active" && right.status === "active") return 1;
      // Then emergency first among same status
      if (left.category === "emergency" && right.category !== "emergency") return -1;
      if (left.category !== "emergency" && right.category === "emergency") return 1;
      return 0;
    });
  }, [requests]);

  const filteredRequests = useMemo(() => {
    let result = sortedRequests.filter((request) => request.status === statusFilter);

    if (!normalizedActiveFilter) {
      return result;
    }

    return result.filter(
      (request) => String(request.patient_id).trim().toLowerCase() === normalizedActiveFilter,
    );
  }, [sortedRequests, normalizedActiveFilter, statusFilter]);

  const selectedRequest = useMemo(
    () => filteredRequests.find((request) => request.id === selectedRequestId) || filteredRequests[0] || null,
    [filteredRequests, selectedRequestId],
  );

  const handleResolveRequest = (resolvedRequestId) => {
    dismissRequest(resolvedRequestId);
  };

  const applyPatientFilter = () => {
    const normalizedValue = patientIdInput.trim();
    setActivePatientIdFilter(normalizedValue);
    setSelectedRequestId(null);
  };

  const clearPatientFilter = () => {
    setPatientIdInput('');
    setActivePatientIdFilter('');
    setSelectedRequestId(null);
  };

  return (
    <div className="nurse-page">
      <header className="nurse-header">
        <h1>Nurse Requests Dashboard</h1>
      </header>
      <div className="nurse-layout">
        <aside className="nurse-list-panel">
          <div className="nurse-list-header">
            <h2>Incoming requests</h2>
            <div className="nurse-filter-controls">
              <div className="nurse-status-toggle-container">
                <label htmlFor="status-toggle" className="nurse-toggle-label">
                  {statusFilter === 'active' ? 'Unresolved' : 'Resolved'}
                </label>
                <button
                  id="status-toggle"
                  type="button"
                  className={`nurse-status-toggle ${statusFilter === 'active' ? 'active' : 'done'}`}
                  onClick={() =>
                    setStatusFilter(statusFilter === 'active' ? 'done' : 'active')
                  }
                  aria-label={`Toggle between unresolved and resolved requests (currently showing ${statusFilter} requests)`}
                >
                  <span className="nurse-toggle-handle" />
                </button>
              </div>
              <button
                type="button"
                className="nurse-filter-toggle-btn"
                onClick={() => setShowPatientFilter((previous) => !previous)}
              >
                Filter by patient
              </button>
            </div>
          </div>
          {showPatientFilter ? (
            <div className="nurse-filter-row">
              <input
                type="text"
                className="nurse-filter-input"
                placeholder="Enter patient ID"
                value={patientIdInput}
                onChange={(event) => setPatientIdInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    applyPatientFilter();
                  }
                }}
              />
              <button
                type="button"
                className="nurse-filter-apply-btn"
                onClick={applyPatientFilter}
              >
                Apply
              </button>
              <button
                type="button"
                className="nurse-filter-clear-btn"
                onClick={clearPatientFilter}
              >
                Clear
              </button>
            </div>
          ) : null}
          {normalizedActiveFilter ? (
            <div className="nurse-filter-active-note">
              Showing requests for patient ID: {activePatientIdFilter}
            </div>
          ) : null}
          <div className="nurse-request-list">
            {filteredRequests.map((request) => {
              const isActive = request.id === selectedRequest?.id;
              const isEmergency = request.category === "emergency";
              return (
                <div
                  key={request.id}
                  className={`nurse-request-item ${isActive ? "active" : ""} ${isEmergency ? "emergency" : ""}`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="nurse-request-item-top">
                    <div className="nurse-patient-lines">
                      <span>Patient: {request.patientDisplayName}</span>
                      <span className="nurse-patient-id-line">ID: {request.patient_id}</span>
                    </div>
                    <span>{request.createdAt}</span>
                  </div>
                  <div className="nurse-request-item-main">
                    Request: {request.rawRequest}
                  </div>
                  <div className="nurse-request-item-status-row">
                    <div className="nurse-request-item-meta">
                      {request.category}
                    </div>
                  </div>
                  <div className="nurse-request-actions">
                    {request.status === 'active' ? (
                      <button
                        type="button"
                        className="nurse-request-resolve-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleResolveRequest(request.id);
                        }}
                      >
                        Resolve
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {filteredRequests.length === 0 ? (
              <div className="nurse-empty-state">
                {normalizedActiveFilter
                  ? `No ${statusFilter === 'active' ? 'unresolved' : 'resolved'} requests found for this patient ID.`
                  : `No ${statusFilter === 'active' ? 'unresolved' : 'resolved'} requests.`}
              </div>
            ) : null}
          </div>
        </aside>
        <section className="nurse-detail-panel">
          {selectedRequest ? (
            <>
              <div className="nurse-detail-card">
                <h3>Patient original request</h3>
                <p className="nurse-raw-request">
                  {selectedRequest.rawRequest || "No request text"}
                </p>
              </div>
              <div className="nurse-detail-card">
                <h3>AI reformulated request</h3>
                <div className="nurse-ai-box">
                  {selectedRequest.aiRephrasedRequest || "No AI response yet"}
                </div>
              </div>
              <div className="nurse-detail-card">
                <h3>Patient history (AI context)</h3>
                <ul className="nurse-history-list">
                  {(selectedRequest.patientHistory || []).map((historyItem) => (
                    <li key={historyItem}>{historyItem}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="nurse-detail-card nurse-empty-state">
              No active requests right now. New requests will appear here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
