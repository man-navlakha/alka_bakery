import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const AuthContext = createContext();

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Provider using localStorage for Refresh Token (Alternative 1)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // logged-in user info
    // Access token still loaded from localStorage initially
    const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken") || null);
    const [loading, setLoading] = useState(true);

    // On app load, try to refresh access token using localStorage refresh token
    useEffect(() => {
        const initAuth = async () => {
            // Read refresh token from localStorage
            const storedRefreshToken = localStorage.getItem("refreshToken");
            console.log("AuthProvider: initAuth running...");

            // If no refresh token, user is not logged in
            if (!storedRefreshToken) {
                console.log("AuthProvider: No refresh token found in localStorage.");
                localStorage.removeItem("accessToken"); // Clear any potentially stale access token
                setAccessToken(null);
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                console.log("AuthProvider: Attempting to refresh token using localStorage token...");
                // Send refresh token in the body, remove credentials: 'include'
                const refreshRes = await fetch("http://localhost:3000/api/auth/refresh-token", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' }, // Specify content type
                    body: JSON.stringify({ refreshToken: storedRefreshToken }) // Send token in body
                });
                console.log("AuthProvider: Refresh response status:", refreshRes.status);

                if (!refreshRes.ok) {
                    const errorText = await refreshRes.text();
                    console.warn("AuthProvider: Refresh token invalid or missing. Response:", errorText);
                    // Clear both tokens if refresh fails
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    setAccessToken(null);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // If refresh succeeded, get the new access token
                const refreshData = await refreshRes.json();
                const newAccessToken = refreshData.accessToken;
                console.log("AuthProvider: Got new access token:", newAccessToken.substring(0, 10) + "...");

                // Update state and localStorage with the new access token
                setAccessToken(newAccessToken);
                localStorage.setItem("accessToken", newAccessToken);

                // Use the NEW access token to fetch the user profile
                console.log("AuthProvider: Fetching profile with new token...");
                const profileRes = await fetch("http://localhost:3000/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${newAccessToken}`,
                    },
                });
                console.log("AuthProvider: Profile response status:", profileRes.status);

                if (!profileRes.ok) {
                    const profileErrorText = await profileRes.text();
                    console.error("AuthProvider: Failed to fetch profile after refresh. Response:", profileErrorText);
                    // Clear tokens if profile fetch fails
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    setAccessToken(null);
                    setUser(null);
                } else {
                    const profileData = await profileRes.json();
                    if (profileData && profileData.user) {
                        console.log("AuthProvider: Profile fetched successfully:", profileData.user);
                        setUser(profileData.user); // Set the user state
                    } else {
                        console.error("AuthProvider: Unexpected profile data format:", profileData);
                        setUser(null);
                    }
                }

            } catch (err) {
                console.error("AuthProvider: Auth initialization failed:", err);
                // Clear tokens on any error during the process
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setAccessToken(null);
                setUser(null);
            } finally {
                console.log("AuthProvider: Setting loading to false.");
                setLoading(false); // Always stop loading at the end
            }
        };

        initAuth();
    }, []); // Empty dependency array ensures this runs only once on mount

    const login = async (email, password) => {
        try { // Add try...catch for better error handling
            const res = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setAccessToken(data.accessToken);
                localStorage.setItem("accessToken", data.accessToken);
                // Store refresh token in localStorage
                localStorage.setItem("refreshToken", data.refreshToken);
                setUser(data.user);
                console.log("Login successful, tokens stored in localStorage.");
                return { success: true, user: data.user }; // Return user data
            } else {
                console.error("Login failed:", data.message);
                return { success: false, message: data.message || "Login failed" };
            }
        } catch (error) {
            console.error("Login network error:", error);
            return { success: false, message: "Network error during login." };
        }
    };

    const logout = async () => {
        // Optional: Call backend logout if it invalidates the DB token
        try {
             const storedRefreshToken = localStorage.getItem("refreshToken");
             if (storedRefreshToken) {
                // Inform backend to invalidate token if your backend supports it
                await fetch("http://localhost:3000/api/auth/logout", {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ refreshToken: storedRefreshToken }) // Send token if backend needs it
                });
             }
        } catch (error) {
             console.error("Error during backend logout:", error);
             // Proceed with frontend logout anyway
        }

        // Clear frontend state and localStorage
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken"); // Remove refresh token
        console.log("Logout successful, tokens removed from localStorage.");
        // Consider redirecting the user here if needed, e.g., using useNavigate
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
            {!loading && children} {/* Render children only after initial loading check */}
        </AuthContext.Provider>
    );
};