import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./Context/AuthProvider.jsx";
// import { CartProvider } from './Context/CartContext.jsx';

createRoot(document.getElementById('root')).render(
// ✅ Router must be the parent
  <AuthProvider>
    <App />
  </AuthProvider>
)
