// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthProvider"; // Assuming context provides token/loading state
import { apiFetch } from "../Context/apiFetch"; // Your fetch utility
import { Navigate } from "react-router-dom";

export default function Profile() {
  const { accessToken, loading: authLoading } = useAuth(); // Get token and auth loading state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if auth isn't loading and we have an access token
    if (!authLoading && accessToken) {
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
          // Use apiFetch to call the NEW profile endpoint
          const data = await apiFetch("http://localhost:3000/api/profile"); // Use full URL if not using proxy
          if (data && data.user) {
            setProfile(data.user);
          } else {
             throw new Error("Profile data not found in response");
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
          setError(err.message || "Could not load profile.");
          if (err.message === "Session expired" || err.message === "Session refresh failed") {
              // Let apiFetch handle the redirect via AuthProvider or directly
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else if (!authLoading && !accessToken) {
        // If auth check is done and there's no token, stop loading
        setLoading(false);
    }
  }, [accessToken, authLoading]); // Re-fetch if accessToken changes (e.g., after refresh)

  // Combined loading state
  const isLoading = authLoading || loading;

  if (isLoading) {
    return <div className="p-10 text-center">Loading profile...</div>;
  }

  // If not loading and no accessToken (implies not logged in)
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If there was an error fetching
  if (error) {
     return <div className="p-10 text-center text-red-600">Error: {error}</div>;
  }

  // If loading is finished and profile exists
  if (profile) {
    return (
      <div className="p-10 text-center max-w-md mx-auto mt-10 border rounded-lg shadow-md bg-white">
        <h1 className="text-2xl font-bold mb-4 text-pink-700">Your Profile</h1>
        <p className="text-gray-800 text-lg mb-2">
          <span className="font-semibold">Welcome,</span> {profile.name}!
        </p>
        <p className="text-gray-600 mb-1">
          <span className="font-semibold">Email:</span> {profile.email}
        </p>
        {profile.role && (
           <p className="text-gray-600 mb-1">
             <span className="font-semibold">Role:</span> {profile.role}
           </p>
        )}
        {profile.created_at && (
            <p className="text-gray-500 text-sm mt-4">
                Member since: {new Date(profile.created_at).toLocaleDateString()}
            </p>
        )}
        {/* Add an Edit Profile button/form that calls PUT /api/profile */}
      </div>
    );
  }

  // Fallback if profile is null but user is logged in (should ideally show error)
  return <div className="p-10 text-center">Could not load profile data.</div>;
}