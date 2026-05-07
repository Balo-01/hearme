import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { RequestsProvider } from './context/RequestsContext.jsx';
import { EyeTrackingProvider } from './context/EyeTrackingContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EyeTrackingProvider>
      <RequestsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RequestsProvider>
    </EyeTrackingProvider>
  </StrictMode>
);
