export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  // Try to refresh if token expired
  // Inside the 401 handling block:
if (res.status === 401) {
  const storedRefreshToken = localStorage.getItem("refreshToken"); // <-- GET FROM LOCALSTORAGE
  if (!storedRefreshToken) { // <-- Handle if missing
      console.warn("apiFetch: Access token expired, but no refresh token found.");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      throw new Error("Session expired, no refresh token");
  }
  try { // <-- Add try block for refresh
    const refreshRes = await fetch("http://localhost:3000/api/auth/refresh-token", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' }, // <-- ADD HEADER
      // NO credentials: 'include'
      body: JSON.stringify({ refreshToken: storedRefreshToken }) // <-- SEND IN BODY
    });

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      localStorage.setItem("accessToken", refreshData.accessToken);
      console.log("apiFetch: Token refreshed successfully."); // Add log
      // Retry original request with NEW access token
      return apiFetch(url, { // Ensure this retry uses the new token
        ...options,
        headers: {
          ...(options.headers || {}),
          'Authorization': `Bearer ${refreshData.accessToken}`, // Use new token
        },
      });
    } else {
      console.warn("apiFetch: Refresh token failed. Logging out.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken"); // <-- REMOVE REFRESH TOKEN
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  } catch (refreshError) { // <-- Catch potential errors during refresh fetch
      console.error("apiFetch: Error during token refresh:", refreshError);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Session refresh failed");
  }
}

  // handle non-JSON responses (like HTML error pages)
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid JSON response");
  }

  return res.json();
};
