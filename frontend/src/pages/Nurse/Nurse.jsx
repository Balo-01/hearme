import { useMemo, useState } from 'react';
import '../../App.css';
import { useRequests } from '../../context/RequestsContext.jsx';

export default function Nurse() {
  const { requests, dismissRequest } = useRequests();
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [patientCnpSearch, setPatientCnpSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const normalizedCnpSearch = patientCnpSearch.trim().toLowerCase();

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

  const statusScopedRequests = useMemo(
    () => sortedRequests.filter((request) => request.status === statusFilter),
    [sortedRequests, statusFilter],
  );

  const filteredRequests = useMemo(() => {
    if (!normalizedCnpSearch) {
      return statusScopedRequests;
    }

    return statusScopedRequests.filter(
      (request) => String(request.patient_cnp || '').trim().toLowerCase().startsWith(normalizedCnpSearch),
    );
  }, [statusScopedRequests, normalizedCnpSearch]);

  const matchingPatients = useMemo(() => {
    if (!normalizedCnpSearch) {
      return [];
    }

    const uniquePatients = new Map();
    statusScopedRequests.forEach((request) => {
      const cnp = String(request.patient_cnp || '').trim();
      if (!cnp) {
        return;
      }
      if (!cnp.toLowerCase().startsWith(normalizedCnpSearch)) {
        return;
      }
      if (!uniquePatients.has(cnp)) {
        uniquePatients.set(cnp, {
          cnp,
          name: request.patientDisplayName,
        });
      }
    });

    return Array.from(uniquePatients.values()).slice(0, 6);
  }, [statusScopedRequests, normalizedCnpSearch]);

  const selectedRequest = useMemo(
    () => filteredRequests.find((request) => request.id === selectedRequestId) || filteredRequests[0] || null,
    [filteredRequests, selectedRequestId],
  );

  const handleResolveRequest = (resolvedRequestId) => {
    dismissRequest(resolvedRequestId);
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
            </div>
          </div>
          <div className="nurse-search-row">
            <input
              type="text"
              className="nurse-filter-input"
              placeholder="Search by patient CNP"
              value={patientCnpSearch}
              onChange={(event) => {
                const numericValue = event.target.value.replace(/\D/g, '').slice(0, 13);
                setPatientCnpSearch(numericValue);
                setSelectedRequestId(null);
              }}
              maxLength={13}
            />
            <div className="nurse-search-meta">
              {patientCnpSearch.length > 0
                ? `${patientCnpSearch.length}/13 digits`
                : 'Type a CNP to filter requests'}
            </div>
            {matchingPatients.length > 0 ? (
              <div className="nurse-search-matches">
                {matchingPatients.map((patient) => (
                  <button
                    key={patient.cnp}
                    type="button"
                    className="nurse-search-match-btn"
                    onClick={() => {
                      setPatientCnpSearch(patient.cnp);
                      setSelectedRequestId(null);
                    }}
                  >
                    {patient.name} - {patient.cnp}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
                      <span className="nurse-patient-id-line">CNP: {request.patient_cnp || 'Unknown'}</span>
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
                {normalizedCnpSearch
                  ? `No ${statusFilter === 'active' ? 'unresolved' : 'resolved'} requests found for this patient CNP.`
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
