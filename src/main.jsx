import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./Context/AuthProvider.jsx";
import { BrowserRouter } from "react-router-dom"; // 1. Import BrowserRouter

createRoot(document.getElementById('root')).render(
  // 2. Wrap everything with BrowserRouter first
  <BrowserRouter> 
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)