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
            // Step 1: Attempt to get a new access token using the refresh token cookie
            const refreshRes = await fetch("http://localhost:3000/api/auth/refresh-token", {
                method: "POST",
                credentials: "include", // Sends the httpOnly cookie automatically
                // REMOVED: headers: { Authorization: `Bearer ${data.accessToken}` }, //<- This was the error
            });

            if (!refreshRes.ok) {
                // If refresh fails (no cookie, expired cookie, invalid cookie, server error)
                console.warn("Refresh token invalid or missing. User needs to login.");
                localStorage.removeItem("accessToken"); // Clear any potentially stale access token
                setAccessToken(null);
                setUser(null);
                setLoading(false); // Stop loading, we know the user is logged out
                return; // Stop execution here
            }

            // Step 2: If refresh succeeded, get the new access token
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.accessToken; // Get the new token

            setAccessToken(newAccessToken); // Update state
            localStorage.setItem("accessToken", newAccessToken); // Update localStorage

            // Step 3: Use the NEW access token to fetch the user profile
            const profileRes = await fetch("http://localhost:3000/api/auth/me", {
                headers: {
                    // Use the newAccessToken obtained from the refresh call
                    Authorization: `Bearer ${newAccessToken}`,
                },
            });

            if (!profileRes.ok) {
               // Handle case where profile fetch fails even with a new token
               console.error("Failed to fetch profile even after token refresh.");
               localStorage.removeItem("accessToken");
               setAccessToken(null);
               setUser(null);
            } else {
               const profileData = await profileRes.json();
               // Check if profileData actually contains the user object
               if (profileData && profileData.user) {
                   setUser(profileData.user); // Set the user state!
               } else {
                   // Handle unexpected profile response format
                   console.error("Unexpected profile data format:", profileData);
                   setUser(null);
               }
            }

        } catch (err) {
            console.error("Auth initialization failed:", err.message);
            // Ensure cleanup in case of any error during the process
            localStorage.removeItem("accessToken");
            setAccessToken(null);
            setUser(null);
        } finally {
            setLoading(false); // Always stop loading at the end
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
