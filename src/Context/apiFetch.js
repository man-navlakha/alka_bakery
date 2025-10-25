export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");
  const isFormData = options.body instanceof FormData; // Check if body is FormData

  // Construct headers, excluding Content-Type if it's FormData
  const headers = {
    // Only add 'Content-Type': 'application/json' if it's NOT FormData
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: headers, // Use the constructed headers
    credentials: "include", // Keep if needed for cookies, though token is usually sufficient
  });

  // --- Handle potential token expiry and refresh ---
  if (res.status === 401) {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
      console.warn("apiFetch: Access token expired, but no refresh token found.");
      localStorage.removeItem("accessToken");
      window.location.href = "/login"; // Redirect to login
      throw new Error("Session expired, no refresh token");
    }
    try {
      const refreshRes = await fetch("http://localhost:3000/api/auth/refresh-token", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        localStorage.setItem("accessToken", refreshData.accessToken);
        console.log("apiFetch: Token refreshed successfully.");
        // Retry original request with NEW access token and correct headers
        const newHeaders = {
             ...(!isFormData && { 'Content-Type': 'application/json' }), // Re-apply conditional Content-Type
            ...(options.headers || {}),
            'Authorization': `Bearer ${refreshData.accessToken}`, // Use new token
        };
        return apiFetch(url, { // Retry the original call
           ...options,
           headers: newHeaders,
        });
      } else {
        console.warn("apiFetch: Refresh token failed. Logging out.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    } catch (refreshError) {
      console.error("apiFetch: Error during token refresh:", refreshError);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Session refresh failed");
    }
  }

  // --- Check response type before parsing ---
  const contentType = res.headers.get("content-type");

  if (!res.ok) {
     // If the response is not OK, try to parse error as JSON, otherwise throw status text
     if (contentType?.includes("application/json")) {
         const errorData = await res.json();
         throw new Error(errorData.message || res.statusText);
     } else {
         throw new Error(res.statusText || `HTTP error! status: ${res.status}`);
     }
  }

  // Handle successful responses
  if (res.status === 204 || res.status === 205) {
     // No content to parse
     return null;
  }

  if (contentType?.includes("application/json")) {
    return res.json(); // Only parse as JSON if the header indicates it
  } else {
     // Handle non-JSON responses if necessary, e.g., text
     // For now, let's assume successful non-JSON isn't expected often for this API
     console.warn("apiFetch: Received non-JSON response:", contentType);
     return res.text(); // Or handle as needed
  }
};