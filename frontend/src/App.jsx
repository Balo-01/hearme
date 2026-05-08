import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/patient/Home';
import BasicNeeds from './pages/patient/BasicNeeds/BasicNeeds';
import BasicNeedsOther from './pages/patient/BasicNeeds/BasicNeedsOther';
import Communication from './pages/patient/Communication/Communication';
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

function App() {
  const { state } = useEyeTracking();
  const { isModalOpen, setIsModalOpen } = useModal();
  const location = useLocation();
  const isPatientHomeRoute = location.pathname === '/patient';

  const showCalibration =
    state === TrackingState.DISCONNECTED ||
    state === TrackingState.PRE_CALIBRATION ||
    state === TrackingState.CALIBRATING;
  const canOpenPatientModal = state === TrackingState.TRACKING && isPatientHomeRoute;

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

  const isNurseRoute = location.pathname === '/nurse';

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

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/patient" replace />} />
        <Route path="/nurse" element={<Nurse />} />
        
        {/* Patient routes - always defined, but calibration overlay blocks until ready */}
        <Route path="/patient" element={<Home />} />
        <Route path="/patient/basic-needs" element={<BasicNeeds />} />
        <Route path="/patient/basic-needs/other" element={<BasicNeedsOther />} />
        <Route path="/patient/communication" element={<Communication />} />
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
