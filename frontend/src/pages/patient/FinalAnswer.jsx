import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function FinalAnswer() {
  // State passed from previous page carries source category + selected request.
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request || 'Unknown request';
  const normalizedRequest = String(request).toLowerCase();
  const source = location.state?.source || 'basic-needs';
  const { getNavigationProps } = useHoverNavigate(3000);
  const [isRedirectingHome, setIsRedirectingHome] = useState(false);
  const noHoverTimerRef = useRef(null);

  // After "No" is confirmed, show redirect notice then navigate home.
  useEffect(() => {
    if (!isRedirectingHome) {
      return undefined;
    }

    const redirectTimerId = setTimeout(() => {
      navigate('/patient');
    }, 3000);

    return () => clearTimeout(redirectTimerId);
  }, [isRedirectingHome, navigate]);

  useEffect(() => {
    return () => {
      if (noHoverTimerRef.current) {
        clearTimeout(noHoverTimerRef.current);
      }
    };
  }, []);

  const painRequestText = (() => {
    const requestText = String(request);
    const parts = requestText.split(' pain - ');

    if (parts.length === 2) {
      const area = parts[0].trim().toLowerCase();
      const intensity = parts[1].trim().toLowerCase();
      return `You reported ${intensity} pain in ${area}. Is this correct?`;
    }

    return `You reported pain in: ${requestText.toLowerCase()}. Is this correct?`;
  })();

  const messageBySource = {
    'basic-needs': `You requested: ${normalizedRequest}. Is this correct?`,
    communication: `You want to contact: ${normalizedRequest}. Is this correct?`,
    pain: painRequestText,
  };

  const message = messageBySource[source] || `You selected: ${normalizedRequest}. Is this correct?`;

  // "No" keeps the same hover-delay behavior as other critical actions.
  const handleNoMouseEnter = () => {
    if (noHoverTimerRef.current || isRedirectingHome) {
      return;
    }

    noHoverTimerRef.current = setTimeout(() => {
      setIsRedirectingHome(true);
      noHoverTimerRef.current = null;
    }, 3000);
  };

  const handleNoMouseLeave = () => {
    if (noHoverTimerRef.current) {
      clearTimeout(noHoverTimerRef.current);
      noHoverTimerRef.current = null;
    }
  };

  const handleNoActivate = () => {
    if (noHoverTimerRef.current) {
      clearTimeout(noHoverTimerRef.current);
      noHoverTimerRef.current = null;
    }
    setIsRedirectingHome(true);
  };

  if (isRedirectingHome) {
    return <div className="center-message request-sent-message request-sent-redirect">Redirecting to home page...</div>;
  }

  return (
    <>
      <div className="center-message final-answer-message">{message}</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/request-sent', { state: { source, request } })}
        >
          Yes
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={handleNoMouseEnter}
          onMouseLeave={handleNoMouseLeave}
          onClick={handleNoActivate}
        >
          No
        </button>
      </div>
    </>
  );
}
