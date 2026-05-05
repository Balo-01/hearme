import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { RequestsProvider } from './context/RequestsContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Global requests state available to patient and nurse pages. */}
    <RequestsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RequestsProvider>
  </StrictMode>
);
