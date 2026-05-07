import { useCallback, useEffect, useRef } from 'react';
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
  const navigateTo = useCallback((path, navigateOptions) => {
    navigate(path, navigateOptions);
  }, [navigate]);

  const handleMouseEnter = useCallback((path, navigateOptions) => {
    if (hoverTimerRef.current) {
      return;
    }

    hoverTimerRef.current = setTimeout(() => {
      navigateTo(path, navigateOptions);
      hoverTimerRef.current = null;
    }, delay);
  }, [delay, navigateTo]);

  // Cancels pending navigation when pointer leaves the active element.
  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const getNavigationProps = useCallback((path, navigateOptions) => ({
    onMouseEnter: () => handleMouseEnter(path, navigateOptions),
    onMouseLeave: handleMouseLeave,
    onClick: () => navigateTo(path, navigateOptions),
  }), [handleMouseEnter, handleMouseLeave, navigateTo]);

  return { handleMouseEnter, handleMouseLeave, navigateTo, getNavigationProps };
}
