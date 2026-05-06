import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequests } from '../../context/RequestsContext.jsx';
import '../../App.css';

export default function Emergency() {
  const navigate = useNavigate();
  const { addRequest } = useRequests();
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const didSendRef = useRef(false);

  useEffect(() => {
    if (didSendRef.current) {
      return;
    }

    didSendRef.current = true;

    // Emergency is a direct action, so we enqueue it immediately for the nurse dashboard.
    addRequest({
      source: 'emergency',
      request: 'Emergency assistance needed',
    });
  }, [addRequest]);

  useEffect(() => {
    const redirectMessageTimerId = setTimeout(() => {
      setShowRedirectMessage(true);
    }, 3000);

    const redirectTimerId = setTimeout(() => {
      navigate('/patient');
    }, 5000);

    return () => {
      clearTimeout(redirectMessageTimerId);
      clearTimeout(redirectTimerId);
    };
  }, [navigate]);

  return (
    <div className="center-message request-sent-message">
      <div>Someone will help you immediately.</div>
      {showRedirectMessage ? <div className="request-sent-redirect">Redirecting to home page...</div> : null}
    </div>
  );
}
