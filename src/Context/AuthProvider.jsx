import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const AuthContext = createContext();

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // logged-in user info
    const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken") || null);
    const [loading, setLoading] = useState(true);

    // On app load, try to refresh access token using cookie
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/auth/refresh-token", {
                    method: "POST",
                    credentials: "include",
                    headers: { Authorization: `Bearer ${data.accessToken}` },
                });

                if (!res.ok) {
                    console.warn("Refresh token not valid or backend offline");
                    setAccessToken(null);
                    setUser(null);
                    return;
                }

                const data = await res.json();
                setAccessToken(data.accessToken);
                localStorage.setItem("accessToken", data.accessToken);

                const profileRes = await fetch("http://localhost:3000/api/auth/me", {
                    headers: { Authorization: `Bearer ${data.accessToken}` },
                });

                const profileData = await profileRes.json();
                setUser(profileData);
            } catch (err) {
                console.error("Auth init failed:", err.message);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const res = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            setAccessToken(data.accessToken);
            localStorage.setItem("accessToken", data.accessToken);
            setUser(data.user);
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    };

    const logout = async () => {
        // Optional: call backend to invalidate refresh token
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("accessToken");
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
