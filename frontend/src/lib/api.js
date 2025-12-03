export async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies with requests
  };

  return fetch(`${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}${endpoint}`, {
    ...defaultOptions,
    ...options,
  });
}

// Example usage:
// const response = await apiRequest('/projects');
// const data = await response.json();
