import { getAuthToken } from "@/lib/authUtils";

export async function apiRequest(endpoint, options = {}) {
  // Get the Firebase token from localStorage
  const token = getAuthToken();

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies with requests
  };

  // Add Authorization header if token exists
  if (token) {
    defaultOptions.headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}${endpoint}`, {
    ...defaultOptions,
    ...options,
  });
}

// Example usage:
// const response = await apiRequest('/api/projects');
// const data = await response.json();
