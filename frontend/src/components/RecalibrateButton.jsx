import { useCallback, useEffect } from 'react';
import { useEyeTracking, TrackingState } from '../context/EyeTrackingContext';
import '../pages/calibration/Calibration.css';

/**
 * Persistent recalibration hint shown during tracking.
 * Keyboard shortcut: R key triggers recalibration.
 */
export default function RecalibrateButton() {
  const { state, recalibrate } = useEyeTracking();

  const handleRecalibrate = useCallback(() => {
    recalibrate();
  }, [recalibrate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (state !== TrackingState.TRACKING) return;
      if (e.code === 'KeyR' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        handleRecalibrate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleRecalibrate]);

  if (state !== TrackingState.TRACKING) return null;

  return <span className="recalibrate-hint">Press R for recalibrate</span>;
}
