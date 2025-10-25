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
  if (res.status === 401) {
    const refreshRes = await fetch("http://localhost:3000/api/auth/refresh-token", {
      method: "POST",
      // NO body here
      credentials: "include", // Keep this
    });

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      localStorage.setItem("accessToken", refreshData.accessToken);

      // retry once with new token
      return apiFetch(url, options);
    } else {
      console.warn("Refresh token failed. Redirecting to login.");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  // handle non-JSON responses (like HTML error pages)
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid JSON response");
  }

  return res.json();
};
