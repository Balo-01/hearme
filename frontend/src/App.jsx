import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/patient/Home';
import BasicNeeds from './pages/patient/BasicNeeds/BasicNeeds';
import BasicNeedsOther from './pages/patient/BasicNeeds/BasicNeedsOther';
import Communication from './pages/patient/Communication/Communication';
import Pain from './pages/patient/Pain/Pain';
import PainOther from './pages/patient/Pain/PainOther';
import PainIntensity from './pages/patient/Pain/PainIntensity';
import Emergency from './pages/patient/Emergency';
import FinalAnswer from './pages/patient/FinalAnswer';
import Nurse from './pages/nurse/Nurse';
import RequestSent from './pages/patient/RequestSent';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patient" replace />} />
      <Route path="/patient" element={<Home />} />
      <Route path="/patient/basic-needs" element={<BasicNeeds />} />
      <Route path="/patient/basic-needs/other" element={<BasicNeedsOther />} />
      <Route path="/patient/communication" element={<Communication />} />
      <Route path="/patient/pain" element={<Pain />} />
      <Route path="/patient/pain/other" element={<PainOther />} />
      <Route path="/patient/pain/intensity" element={<PainIntensity />} />
      <Route path="/patient/emergency" element={<Emergency />} />
      <Route path="/nurse" element={<Nurse />} />
      <Route path="/patient/final-answer" element={<FinalAnswer />} />
      <Route path="/patient/request-sent" element={<RequestSent />} />
      <Route path="*" element={<Navigate to="/patient" replace />} />
    </Routes>
  );
}

export default App;
