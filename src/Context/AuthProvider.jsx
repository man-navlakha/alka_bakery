import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';


const AuthContext = createContext();
const CART_ID_KEY = "alka_cart_id";

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // FIX 1: Corrected setter name from YWUser to setUser
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

const API_URL = import.meta?.env?.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:3000/api";

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          // Invalid token? Clear it.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      } catch (error) {
        console.error("Auth check failed", error);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) return { success: false, message: data.message || "Login failed" };

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      
      toast.success("Welcome back!");
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      // FIX 2: Corrected variable name from constRP to const res
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // FIX 3: Corrected payload key from QN to name
        body: JSON.stringify({ name, email, password }), 
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Registration failed");

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      toast.success("Account created!");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message);
    }
  };

const logout = async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch(e) {
        console.error("Logout error", e);
    }
    
    // 1. Clear Auth Tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
    // 2. Clear Cart Session (Crucial for not inheriting old cart)
    localStorage.removeItem(CART_ID_KEY); 
    
    setUser(null);
    toast.success("Logged out successfully");
    
    // 3. Reload to reset all Context states cleanly
    window.location.href = "/login"; 
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, API_URL }}>
      <Toaster position="top-center" reverseOrder={false} />
      {!loading && children}
    </AuthContext.Provider>
  );
};