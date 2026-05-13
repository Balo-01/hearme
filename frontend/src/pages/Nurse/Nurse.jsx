import { useEffect, useMemo, useState } from 'react';
import '../../App.css';
import { useRequests } from '../../context/RequestsContext.jsx';
import { getRecommendations } from '../../services/requestsApi';

export default function Nurse() {
  const { requests, dismissRequest } = useRequests();
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) || requests[0] || null,
    [requests, selectedRequestId],
  );

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

  const handleResolveRequest = (resolvedRequestId) => {
    dismissRequest(resolvedRequestId);
  };

  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    if (!selectedRequest) {
      setAiSummary('');
      return;
    }

    let cancelled = false;
    setAiSummary('');

    getRecommendations(selectedRequest.patient_id, selectedRequest.category)
      .then((data) => {
        if (!cancelled && typeof data?.summary === 'string') {
          setAiSummary(data.summary);
        }
      })
      .catch(() => {
        if (!cancelled) setAiSummary('');
      });

    return () => { cancelled = true; };
  }, [selectedRequest?.id]);

  return (
    <div className="nurse-page">
      <header className="nurse-header">
        <h1>Nurse Requests Dashboard</h1>
      </header>
      <div className="nurse-layout">
        <aside className="nurse-list-panel">
          <h2>Incoming requests</h2>
          <div className="nurse-request-list">
            {sortedRequests.map((request) => {
              const isActive = request.id === selectedRequest?.id;
              const isEmergency = request.category === "emergency";
              return (
                <div
                  key={request.id}
                  className={`nurse-request-item ${isActive ? "active" : ""} ${isEmergency ? "emergency" : ""}`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="nurse-request-item-top">
                    <span>Patient ID: {request.patient_id}</span>
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
                  </div>
                </div>
              );
            })}
            {requests.length === 0 ? (
              <div className="nurse-empty-state">No active requests.</div>
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
                <div className="nurse-ai-box">
                  {aiSummary || 'Loading AI context...'}
                </div>
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
