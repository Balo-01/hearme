import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Emergency() {
  const navigate = useNavigate();
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  useEffect(() => {
    const redirectMessageTimerId = setTimeout(() => {
      setShowRedirectMessage(true);
    }, 3000);

    const redirectTimerId = setTimeout(() => {
      navigate('/');
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
