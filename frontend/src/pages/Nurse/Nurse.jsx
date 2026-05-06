import { useEffect, useMemo, useState } from 'react';
import '../../App.css';
import { useRequests } from '../../context/RequestsContext.jsx';

export default function Nurse() {
	// Requests come from shared local store populated by patient flow.
	const { requests, setRequests } = useRequests();
	const [selectedRequestId, setSelectedRequestId] = useState(requests[0]?.id || null);

	// Keep selection valid whenever list changes.
	useEffect(() => {
		if (requests.length === 0) {
			setSelectedRequestId(null);
			return;
		}

		const requestStillExists = requests.some((request) => request.id === selectedRequestId);
		if (!requestStillExists) {
			setSelectedRequestId(requests[0].id);
		}
	}, [requests, selectedRequestId]);

	// Active request displayed in right-side detail panel.
	const selectedRequest = useMemo(() => requests.find((request) => request.id === selectedRequestId), [requests, selectedRequestId]);

	// Priority order: unread first, then read.
	const sortedRequests = useMemo(() => {
		const getPriority = (request) => {
			if (!request.isRead) {
				return 0;
			}

			return 1;
		};

		return [...requests].sort((left, right) => getPriority(left) - getPriority(right));
	}, [requests]);

	// Opening an item marks it as read, similar to email behavior.
	const handleSelectRequest = (requestId) => {
		setSelectedRequestId(requestId);
		setRequests((previousRequests) =>
			previousRequests.map((request) =>
				request.id === requestId
					? {
							...request,
							isRead: true,
						}
					: request
			)
		);
	};

	// Resolve removes request from queue so only active work remains visible.
	const handleResolveRequest = (resolvedRequestId) => {
		setRequests((previousRequests) => previousRequests.filter((request) => request.id !== resolvedRequestId));
	};

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
							const isEmergency = request.category === 'emergency';

							return (
								<div
									key={request.id}
									className={`nurse-request-item ${isActive ? 'active' : ''} ${
										isEmergency ? 'emergency' : ''
									} ${
										request.isRead ? 'read' : 'unread'
									}`}
									onClick={() => handleSelectRequest(request.id)}
								>
									<div className="nurse-request-item-top">
										<span>{request.patientLabel}</span>
										<span>{request.createdAt}</span>
									</div>
									<div className="nurse-request-item-main">{request.rawRequest}</div>
									<div className="nurse-request-item-status-row">
										<div className="nurse-request-item-meta">{request.category}</div>
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
												Resolved
											</button>
									</div>
								</div>
							);
						})}
						{requests.length === 0 ? <div className="nurse-empty-state">No active requests.</div> : null}
					</div>
				</aside>

				<section className="nurse-detail-panel">
					{selectedRequest ? (
						<>
							<div className="nurse-detail-card">
								<h3>Patient original request</h3>
								<p className="nurse-raw-request">{selectedRequest.rawRequest}</p>
							</div>

							<div className="nurse-detail-card">
								<h3>AI reformulated request</h3>
								<div className="nurse-ai-box">{selectedRequest.aiRephrasedRequest}</div>
							</div>

							<div className="nurse-detail-card">
								<h3>Patient history (AI context)</h3>
								<ul className="nurse-history-list">
									{selectedRequest.patientHistory.map((historyItem) => (
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
