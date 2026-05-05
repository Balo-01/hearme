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

	// Priority order: unread first, then pending-read, then resolved.
	const sortedRequests = useMemo(() => {
		const getPriority = (request) => {
			if (!request.isRead) {
				return 0;
			}

			if (request.status === 'pending') {
				return 1;
			}

			return 2;
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

	// Resolve keeps request in list and updates visual status.
	const handleResolveRequest = (resolvedRequestId) => {
		setRequests((previousRequests) =>
			previousRequests.map((request) =>
				request.id === resolvedRequestId
					? {
							...request,
							status: 'resolved',
							isRead: true,
						}
					: request
			)
		);
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
							const isResolved = request.status === 'resolved';

							return (
								<div
									key={request.id}
									className={`nurse-request-item ${isActive ? 'active' : ''} ${isResolved ? 'resolved' : ''} ${
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
										<div className={`nurse-status-badge ${request.status}`}>{request.status}</div>
									</div>
									<div className="nurse-request-actions">
										{!isResolved ? (
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
										) : null}
									</div>
								</div>
							);
						})}
						{requests.length === 0 ? <div className="nurse-empty-state">No pending requests.</div> : null}
					</div>
				</aside>

				<section className="nurse-detail-panel">
					{selectedRequest ? (
						<>
							<div className="nurse-detail-card">
								<h3>Patient original request</h3>
								<p className="nurse-raw-request">{selectedRequest.rawRequest}</p>
								<div className={`nurse-status-badge ${selectedRequest.status}`}>{selectedRequest.status}</div>
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
							All requests are resolved. New requests will appear here.
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
