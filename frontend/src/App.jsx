import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BasicNeeds from './pages/BasicNeeds/BasicNeeds';
import BasicNeedsOther from './pages/BasicNeeds/BasicNeedsOther';
import Communication from './pages/Communication/Communication';
import CommunicationOther from './pages/Communication/CommunicationOther';
import Pain from './pages/Pain/Pain';
import PainOther from './pages/Pain/PainOther';
import PainIntensity from './pages/Pain/PainIntensity';
import Emergency from './pages/Emergency';
import FinalAnswer from './pages/FinalAnswer';
import Nurse from './pages/Nurse/Nurse';
import RequestSent from './pages/RequestSent';

function App() {
  // Centralized route map for patient flow + nurse dashboard flow.
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/basic-needs" element={<BasicNeeds />} />
      <Route path="/basic-needs/other" element={<BasicNeedsOther />} />
      <Route path="/communication" element={<Communication />} />
      <Route path="/communication/other" element={<CommunicationOther />} />
      <Route path="/pain" element={<Pain />} />
      <Route path="/pain/other" element={<PainOther />} />
      <Route path="/pain/intensity" element={<PainIntensity />} />
      <Route path="/emergency" element={<Emergency />} />
      <Route path="/nurse" element={<Nurse />} />
      <Route path="/final-answer" element={<FinalAnswer />} />
      <Route path="/request-sent" element={<RequestSent />} />
    </Routes>
  );
}

export default App;
