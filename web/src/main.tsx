import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider, CartProvider } from './store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><AuthProvider><CartProvider><App /></CartProvider></AuthProvider></StrictMode>
);
