import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { RequestsProvider } from './context/RequestsContext.jsx';
import { EyeTrackingProvider } from './context/EyeTrackingContext.jsx';
import { PatientProvider } from './context/PatientContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EyeTrackingProvider>
      <PatientProvider>
        <ModalProvider>
          <RequestsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          </RequestsProvider>
        </ModalProvider>
      </PatientProvider>
    </EyeTrackingProvider>
  </StrictMode>
);
