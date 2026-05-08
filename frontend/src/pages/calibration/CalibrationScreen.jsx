import { useEyeTracking, TrackingState } from '../../context/EyeTrackingContext';
import './Calibration.css';

/**
 * Calibration screen renders the server-driven calibration and Kalman tuning
 * points in the browser viewport.
 */
export default function CalibrationScreen() {
  const { state, calibrationData, faceDetected, error } = useEyeTracking();

  if (state !== TrackingState.CALIBRATING) return null;

  const pointNumber = (calibrationData?.pointIndex ?? 0) + 1;
  const totalPoints = calibrationData?.totalPoints ?? 0;
  const isKalmanTuning = calibrationData?.phase === 'kalman_tuning';
  const phaseLabel = isKalmanTuning
    ? 'Step 2 of 2 - Kalman fine tuning'
    : 'Step 1 of 2 - 9-point gaze calibration';
  const formatPercent = (value) => (
    Number.isFinite(value) ? `${Math.round(value * 100)}%` : '--'
  );
  const formatPixels = (value) => (
    Number.isFinite(value) ? `${Math.round(value)} px` : '--'
  );

  const renderPoint = (className, withRing = false) => (
    <div
      className={`calib-point ${className}`}
      style={{
        left: `${calibrationData.pointX}px`,
        top: `${calibrationData.pointY}px`,
      }}
    >
      {withRing ? (
        <svg className="calib-ring" viewBox="0 0 100 100">
          <circle className="calib-ring-bg" cx="50" cy="50" r="45" />
          <circle
            className="calib-ring-progress"
            cx="50"
            cy="50"
            r="45"
            style={{
              strokeDashoffset: `${283 * (1 - (calibrationData.progress || 0))}`,
            }}
          />
        </svg>
      ) : null}
    </div>
  );

  const renderProgress = (label) => (
    <div className="calib-progress-bar">
      <strong>{phaseLabel}</strong>
      <span>{label}</span>
    </div>
  );

  const renderContent = () => {
    if (!calibrationData) {
      return <div className="calib-message">Preparing calibration...</div>;
    }

    switch (calibrationData.status) {
      case 'waiting_face':
        return (
          <div className="calib-center-content">
            <div className={`calib-face-circle ${faceDetected ? 'found' : 'searching'}`} />
            <p className="calib-message">
              {faceDetected ? 'Face detected! Hold still...' : 'Looking for your face...'}
            </p>
            <p className="calib-submessage">Look directly at the camera</p>
          </div>
        );

      case 'countdown':
        return (
          <div className="calib-center-content">
            <div className="calib-countdown-circle" />
            <p className="calib-message">Starting calibration...</p>
            <p className="calib-submessage">Keep your head still and follow the dots</p>
          </div>
        );

      case 'pulse':
        return (
          <>
            {renderPoint('pulse')}
            {renderProgress(`Point ${pointNumber} of ${totalPoints}`)}
          </>
        );

      case 'capturing':
        return (
          <>
            {renderPoint('capturing', true)}
            {renderProgress(`Point ${pointNumber} of ${totalPoints} - Look at the dot`)}
          </>
        );

      case 'quality_check': {
        const quality = calibrationData.quality;
        const qualityOk = Boolean(quality?.ok);

        return (
          <div className="calib-center-content">
            <div className={`calib-quality-card ${qualityOk ? 'ok' : 'warning'}`}>
              <div className="calib-quality-score">{quality?.score ?? '--'}</div>
              <p className="calib-message">
                {qualityOk ? 'Good corner separation' : 'Weak corner separation'}
              </p>
              <p className="calib-submessage">
                {quality?.message || 'Checking whether corner gaze samples are separated enough.'}
              </p>
              <div className="calib-quality-grid">
                <span>
                  Horizontal difference
                  <strong>{formatPercent(quality?.horizontal_spread)}</strong>
                </span>
                <span>
                  Vertical difference
                  <strong>{formatPercent(quality?.vertical_spread)}</strong>
                </span>
                <span>
                  Average error
                  <strong>{formatPixels(quality?.mean_error_px)}</strong>
                </span>
              </div>
            </div>
          </div>
        );
      }

      case 'kalman_starting':
        return (
          <div className="calib-center-content">
            <div className="calib-countdown-circle" />
            <p className="calib-message">Starting Kalman fine tuning...</p>
            <p className="calib-submessage">Next, look at three points to tune the gaze filter</p>
          </div>
        );

      case 'kalman_waiting':
      case 'kalman_capturing':
        return (
          <>
            {renderPoint(
              calibrationData.status === 'kalman_capturing' ? 'capturing' : 'pulse',
              calibrationData.status === 'kalman_capturing',
            )}
            {renderProgress(`Tuning point ${pointNumber} of ${totalPoints} - Hold your gaze steady`)}
          </>
        );

      case 'movement_warning':
        return (
          <>
            {renderPoint('warning')}
            <div className="calib-warning-message">
              Movement detected - please stay still
            </div>
          </>
        );

      default:
        return <div className="calib-message">Calibrating...</div>;
    }
  };

  return (
    <div className="calibration-overlay calibration-active">
      {renderContent()}
      {error && <div className="calib-error">{error}</div>}
    </div>
  );
}
