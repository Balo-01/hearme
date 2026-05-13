import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';

// Reusable hover-to-navigate behavior with cancel-on-leave logic.
export default function useHoverNavigate(delay = 4000) {
  const navigate = useNavigate();
  const hoverTimerRef = useRef(null);
  const activeElementRef = useRef(null);
  const { isModalOpen } = useModal();

  const clearActiveElement = useCallback(() => {
    if (activeElementRef.current) {
      activeElementRef.current.classList.remove('hover-dwell-active');
      activeElementRef.current.style.removeProperty('--dwell-delay');
      activeElementRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      clearActiveElement();
    };
  }, [clearActiveElement]);

  // Starts a delayed navigation only if there is no active timer.
  const navigateTo = useCallback((path, navigateOptions) => {
    navigate(path, navigateOptions);
  }, [navigate]);

  // Cancel any in-progress hover timer when modal opens
  useEffect(() => {
    if (isModalOpen && hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
      clearActiveElement();
    }
  }, [isModalOpen, clearActiveElement]);

  const handleMouseEnter = useCallback((event, path, navigateOptions) => {
    if (isModalOpen) {
      return;
    }
    if (hoverTimerRef.current) {
      return;
    }

    const target = event?.currentTarget;
    if (target) {
      activeElementRef.current = target;
      target.classList.add('hover-dwell-active');
      target.style.setProperty('--dwell-delay', `${delay}ms`);
    }

    hoverTimerRef.current = setTimeout(() => {
      clearActiveElement();
      navigateTo(path, navigateOptions);
      hoverTimerRef.current = null;
    }, delay);
  }, [delay, navigateTo, isModalOpen, clearActiveElement]);

  // Cancels pending navigation when pointer leaves the active element.
  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    clearActiveElement();
  }, [clearActiveElement]);

  const getNavigationProps = useCallback((path, navigateOptions) => ({
    onMouseEnter: () => {},
    onMouseLeave: handleMouseLeave,
    onClick: (event) => {
      // Ignore physical mouse/touch clicks. Keep programmatic clicks from gaze dwell.
      if (event?.nativeEvent?.isTrusted) {
        return;
      }
      navigateTo(path, navigateOptions);
    },
  }), [handleMouseEnter, handleMouseLeave, navigateTo]);

  return { handleMouseEnter, handleMouseLeave, navigateTo, getNavigationProps };
}
