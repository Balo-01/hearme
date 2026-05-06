import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRequests } from '../../context/RequestsContext.jsx';
import '../../App.css';

export default function RequestSent() {
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
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
    addRequest({
      source: location.state?.source,
      request: location.state?.request,
    });
  }, [addRequest, location.state?.request, location.state?.source]);

  // Feedback timeline: show redirect notice, then return user to home.
  useEffect(() => {
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
  }, [navigate]);

  return (
    <div className="center-message request-sent-message">
      <div>Your request has been sent.</div>
      <div>A nurse will come shortly.</div>
      {showRedirectMessage ? <div className="request-sent-redirect">Redirecting to home page...</div> : null}
    </div>
  );
}
