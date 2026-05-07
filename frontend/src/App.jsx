import { Navigate, Route, Routes } from 'react-router-dom';
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
import Nurse from './pages/nurse/Nurse';
import RequestSent from './pages/patient/RequestSent';
import PreCalibration from './pages/calibration/PreCalibration';
import CalibrationScreen from './pages/calibration/CalibrationScreen';
import GazeCursor from './components/GazeCursor';
import RecalibrateButton from './components/RecalibrateButton';
import { useEyeTracking, TrackingState } from './context/EyeTrackingContext';

function App() {
  const { state } = useEyeTracking();

  // Show calibration flow before the main app
  const showCalibration =
    state === TrackingState.DISCONNECTED ||
    state === TrackingState.PRE_CALIBRATION ||
    state === TrackingState.CALIBRATING;

  return (
    <>
      {/* Calibration overlay (covers everything until complete) */}
      {showCalibration && <PreCalibration />}
      <CalibrationScreen />

      {/* Main app flow — rendered only after calibration */}
      {state === TrackingState.TRACKING && (
        <>
          <GazeCursor />
          <RecalibrateButton />
          <Routes>
            <Route path="/" element={<Navigate to="/patient" replace />} />
            <Route path="/patient" element={<Home />} />
            <Route path="/patient/basic-needs" element={<BasicNeeds />} />
            <Route path="/patient/basic-needs/other" element={<BasicNeedsOther />} />
            <Route path="/patient/communication" element={<Communication />} />
            <Route path="/patient/communication/other" element={<CommunicationOther />} />
            <Route path="/patient/pain" element={<Pain />} />
            <Route path="/patient/pain/other" element={<PainOther />} />
            <Route path="/patient/pain/intensity" element={<PainIntensity />} />
            <Route path="/patient/emergency" element={<Emergency />} />
            <Route path="/nurse" element={<Nurse />} />
            <Route path="/patient/final-answer" element={<FinalAnswer />} />
            <Route path="/patient/request-sent" element={<RequestSent />} />
            <Route path="*" element={<Navigate to="/patient" replace />} />
          </Routes>
        </>
      )}
    </>
  );
}

export default App;
