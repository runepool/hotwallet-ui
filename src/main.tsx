import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApi } from './services/api-provider';

// Initialize API client (can be controlled by environment variable)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4123';
initializeApi(apiUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);