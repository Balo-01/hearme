import { useCallback, useEffect, useRef } from 'react';
import { useEyeTracking, TrackingState } from '../context/EyeTrackingContext';
import { useModal } from '../context/ModalContext';

/**
 * GazeCursor renders an overlay dot at the user's gaze position and
 * activates the button under the gaze point after a sustained dwell.
 */

const DWELL_DELAY_MS = 4000;
const DEFAULT_HIT_PADDING = 36;

function findInteractiveTarget(el) {
  if (!el) return null;

  const target = el.closest?.('button, a[href], [role="button"]');
  if (!target || target === document.body) return null;
  if (target.matches?.(':disabled, [aria-disabled="true"]')) return null;

  return target;
}

function isPointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function getDirectionalZone(element) {
  if (!element.classList.contains('quadrant-btn')) return null;

  const midX = window.innerWidth / 2;
  const midY = window.innerHeight / 2;

  if (element.classList.contains('top-left')) {
    return { left: 0, top: 0, right: midX, bottom: midY };
  }
  if (element.classList.contains('top-right')) {
    return { left: midX, top: 0, right: window.innerWidth, bottom: midY };
  }
  if (element.classList.contains('bottom-left')) {
    return { left: 0, top: midY, right: midX, bottom: window.innerHeight };
  }
  if (element.classList.contains('bottom-right')) {
    return { left: midX, top: midY, right: window.innerWidth, bottom: window.innerHeight };
  }

  return null;
}

function getExpandedRect(element) {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left - DEFAULT_HIT_PADDING,
    top: rect.top - DEFAULT_HIT_PADDING,
    right: rect.right + DEFAULT_HIT_PADDING,
    bottom: rect.bottom + DEFAULT_HIT_PADDING,
  };
}

function getRectCenter(rect) {
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  };
}

function findGazeTarget(x, y) {
  const directTarget = findInteractiveTarget(document.elementFromPoint(x, y));
  if (directTarget) return directTarget;

  const candidates = Array.from(
    document.querySelectorAll('button, a[href], [role="button"]'),
  )
    .filter((target) => !target.matches?.(':disabled, [aria-disabled="true"]'))
    .map((target) => ({
      target,
      rect: getDirectionalZone(target) || getExpandedRect(target),
    }))
    .filter(({ rect }) => isPointInRect(x, y, rect))
    .sort((left, right) => {
      const leftCenter = getRectCenter(left.rect);
      const rightCenter = getRectCenter(right.rect);
      const leftDistance = Math.hypot(x - leftCenter.x, y - leftCenter.y);
      const rightDistance = Math.hypot(x - rightCenter.x, y - rightCenter.y);
      return leftDistance - rightDistance;
    });

  return candidates[0]?.target || null;
}

export default function GazeCursor() {
  const { state, gazePosition, gazeValid, isBlinking } = useEyeTracking();
  const { isModalOpen } = useModal();
  const cursorRef = useRef(null);
  const activeTargetRef = useRef(null);
  const dwellTimerRef = useRef(null);

  const clearActiveTarget = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }

    if (activeTargetRef.current) {
      activeTargetRef.current.classList.remove('gaze-dwell-active');
      activeTargetRef.current.style.removeProperty('--dwell-delay');
      activeTargetRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (
      state !== TrackingState.TRACKING ||
      !gazeValid ||
      isBlinking ||
      isModalOpen ||
      gazePosition.x < 0 ||
      gazePosition.y < 0
    ) {
      clearActiveTarget();
      return;
    }

    const cursor = cursorRef.current;
    if (!cursor) return;

    const x = Math.max(0, Math.min(window.innerWidth - 1, gazePosition.x));
    const y = Math.max(0, Math.min(window.innerHeight - 1, gazePosition.y));

    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.style.opacity = '1';

    const target = findGazeTarget(x, y);

    if (target === activeTargetRef.current) {
      return;
    }

    clearActiveTarget();

    if (!target) {
      return;
    }

    activeTargetRef.current = target;

    // Delay 1s before applying hover/mărire effect, then start dwell timer
    dwellTimerRef.current = setTimeout(() => {
      if (activeTargetRef.current !== target) return;
      target.classList.add('gaze-dwell-active');
      target.style.setProperty('--dwell-delay', `${DWELL_DELAY_MS}ms`);

      dwellTimerRef.current = setTimeout(() => {
        const targetToActivate = activeTargetRef.current;
        clearActiveTarget();
        targetToActivate?.click();
      }, DWELL_DELAY_MS);
    }, 1000);
  }, [state, gazePosition, gazeValid, isBlinking, isModalOpen, clearActiveTarget]);

  // Hide cursor when blinking or not tracking
  useEffect(() => {
    if (state !== TrackingState.TRACKING || !gazeValid || isBlinking) {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0.3';
      }
      clearActiveTarget();
    }
  }, [state, gazeValid, isBlinking, clearActiveTarget]);

  useEffect(() => clearActiveTarget, [clearActiveTarget]);

  if (state !== TrackingState.TRACKING) return null;

  return (
    <div
      ref={cursorRef}
      className="gaze-cursor"
      style={{
        position: 'fixed',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.3) 70%, transparent 100%)',
        border: '2px solid rgba(59, 130, 246, 0.6)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 99999,
        transition: 'left 0.05s linear, top 0.05s linear, opacity 0.2s',
        opacity: 0,
      }}
    />
  );
}
