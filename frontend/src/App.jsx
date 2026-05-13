import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/patient/Home';
import BasicNeeds from './pages/patient/BasicNeeds/BasicNeeds';
import BasicNeedsOther from './pages/patient/BasicNeeds/BasicNeedsOther';
import Communication from './pages/patient/Communication/Communication';
import CommunicationOther from './pages/patient/Communication/CommunicationOther';
import Pain from './pages/patient/Pain/Pain';
import PainOther from './pages/patient/Pain/PainOther';
import PainIntensity from './pages/patient/Pain/PainIntensity';
import Emergency from './pages/patient/Emergency';
import FinalAnswer from './pages/patient/FinalAnswer';
import Nurse from './pages/Nurse/Nurse';
import RequestSent from './pages/patient/RequestSent';
import PreCalibration from './pages/calibration/PreCalibration';
import CalibrationScreen from './pages/calibration/CalibrationScreen';
import GazeCursor from './components/GazeCursor';
import RecalibrateButton from './components/RecalibrateButton';
import PatientIdModal from './components/PatientIdModal';
import { useEyeTracking, TrackingState } from './context/EyeTrackingContext';
import { useModal } from './context/ModalContext';

const GAZE_CAMERA_ROUTES = new Set([
  '/patient',
  '/patient/basic-needs',
  '/patient/basic-needs/other',
  '/patient/communication',
  '/patient/communication/other',
  '/patient/pain',
  '/patient/pain/other',
  '/patient/pain/intensity',
  '/patient/final-answer',
]);
const HIDE_GAZE_CAMERA_PREVIEW_EVENT = 'hearme:hide-gaze-camera-preview';

function App() {
  const { state, cameraPreview, checkFace } = useEyeTracking();
  const { isModalOpen, setIsModalOpen } = useModal();
  const location = useLocation();
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const isPatientHomeRoute = location.pathname === '/patient';
  const isNurseRoute = location.pathname === '/nurse';

  const showCalibration =
    state === TrackingState.DISCONNECTED ||
    state === TrackingState.PRE_CALIBRATION ||
    state === TrackingState.CALIBRATING;
  const canOpenPatientModal = state === TrackingState.TRACKING && isPatientHomeRoute;
  const isGazePage = !isNurseRoute && state === TrackingState.TRACKING && GAZE_CAMERA_ROUTES.has(location.pathname);

  // Listen for 'P' key to open patient ID modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!canOpenPatientModal) {
        return;
      }

      if ((e.key === 'p' || e.key === 'P') && !isModalOpen) {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canOpenPatientModal, isModalOpen, setIsModalOpen]);

  useEffect(() => {
    if (!canOpenPatientModal && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [canOpenPatientModal, isModalOpen, setIsModalOpen]);

  useEffect(() => {
    if (!isGazePage) {
      setShowCameraPreview(false);
    }
  }, [isGazePage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen || !isGazePage) {
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowCameraPreview((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGazePage, isModalOpen]);

  useEffect(() => {
    if (!showCameraPreview || !isGazePage || isModalOpen) {
      return undefined;
    }

    checkFace();
    const intervalId = setInterval(() => {
      checkFace();
    }, 500);

    return () => clearInterval(intervalId);
  }, [showCameraPreview, isGazePage, isModalOpen, checkFace]);

  useEffect(() => {
    const handleHideCameraPreview = () => {
      setShowCameraPreview(false);
    };

    window.addEventListener(HIDE_GAZE_CAMERA_PREVIEW_EVENT, handleHideCameraPreview);
    return () => window.removeEventListener(HIDE_GAZE_CAMERA_PREVIEW_EVENT, handleHideCameraPreview);
  }, []);

  return (
    <>
      {/* Patient ID Modal - accessible on home page by pressing 'P' */}
      {!isNurseRoute && (
        <PatientIdModal
          isOpen={canOpenPatientModal && isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Calibration overlay and gaze cursor (patient flow only) */}
      {!isNurseRoute && showCalibration && <PreCalibration />}
      {!isNurseRoute && <CalibrationScreen />}
      {!isNurseRoute && state === TrackingState.TRACKING && <GazeCursor />}
      {!isNurseRoute && state === TrackingState.TRACKING && <RecalibrateButton />}
      {!isNurseRoute && isGazePage && showCameraPreview && (
        <div className="gaze-webcam-preview">
          {cameraPreview ? (
            <img
              className="gaze-webcam-preview-image"
              src={cameraPreview}
              alt="Webcam preview"
            />
          ) : (
            <div className="gaze-webcam-preview-placeholder">
              Waiting for webcam preview...
            </div>
          )}
        </div>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/patient" replace />} />
        <Route path="/nurse" element={<Nurse />} />
        
        {/* Patient routes - always defined, but calibration overlay blocks until ready */}
        <Route path="/patient" element={<Home />} />
        <Route path="/patient/basic-needs" element={<BasicNeeds />} />
        <Route path="/patient/basic-needs/other" element={<BasicNeedsOther />} />
        <Route path="/patient/communication" element={<Communication />} />
        <Route path="/patient/communication/other" element={<CommunicationOther />} />
        <Route path="/patient/pain" element={<Pain />} />
        <Route path="/patient/pain/other" element={<PainOther />} />
        <Route path="/patient/pain/intensity" element={<PainIntensity />} />
        <Route path="/patient/emergency" element={<Emergency />} />
        <Route path="/patient/final-answer" element={<FinalAnswer />} />
        <Route path="/patient/request-sent" element={<RequestSent />} />
        
        <Route path="*" element={<Navigate to={isNurseRoute ? "/nurse" : "/patient"} replace />} />
      </Routes>
    </>
  );
}

export default App;
