import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Reusable hover-to-navigate behavior with cancel-on-leave logic.
export default function useHoverNavigate(delay = 3000) {
  const navigate = useNavigate();
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Starts a delayed navigation only if there is no active timer.
  const handleMouseEnter = (path, navigateOptions) => {
    if (hoverTimerRef.current) {
      return;
    }

    hoverTimerRef.current = setTimeout(() => {
      navigate(path, navigateOptions);
      hoverTimerRef.current = null;
    }, delay);
  };

  // Cancels pending navigation when pointer leaves the active element.
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  return { handleMouseEnter, handleMouseLeave };
}
