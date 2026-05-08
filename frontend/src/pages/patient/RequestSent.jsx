import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRequests } from '../../context/RequestsContext.jsx';
import '../../App.css';

export default function RequestSent() {
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const didSendRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addRequest } = useRequests();

  // Save confirmed request to shared list exactly once.
  useEffect(() => {
    if (didSendRef.current) {
      return;
    }

    didSendRef.current = true;

    const sendRequest = async () => {
      try {
        await addRequest({
          source: location.state?.source,
          request: location.state?.request,
          path: location.state?.path,
        });
        setSuccess(true);
      } catch (err) {
        setError(err?.message || 'Failed to send request');
        console.error('Request send error:', err);
      }
    };

    sendRequest();
  }, [addRequest, location.state?.request, location.state?.source, location.state?.path]);

  // Feedback timeline: show redirect notice, then return user to home (only if successful).
  useEffect(() => {
    if (!success) {
      return;
    }

    const redirectMessageTimerId = setTimeout(() => {
      setShowRedirectMessage(true);
    }, 3000);

    const redirectTimerId = setTimeout(() => {
      navigate('/patient');
    }, 6000);

    return () => {
      clearTimeout(redirectMessageTimerId);
      clearTimeout(redirectTimerId);
    };
  }, [navigate, success]);

  // If request submission fails, show an explicit error and let the user return home.
  if (error) {
    return (
      <div className="center-message request-sent-message error-state">
        <div style={{ color: 'red' }}>Error sending request</div>
        <div style={{ fontSize: '0.9em', marginTop: '1rem' }}>{error}</div>
        <button
          onClick={() => navigate('/patient')}
          style={{ marginTop: '1rem' }}
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="center-message request-sent-message">
      <div>Your request has been sent.</div>
      <div>A nurse will come shortly.</div>
      {showRedirectMessage ? <div className="request-sent-redirect">Redirecting to home page...</div> : null}
    </div>
  );
}
