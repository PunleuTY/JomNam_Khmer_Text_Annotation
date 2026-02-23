import { getAuthToken } from "@/lib/authUtils";

export async function apiRequest(endpoint, options = {}) {
  // Get the Firebase token from localStorage
  const token = getAuthToken();
  const base = import.meta.env.VITE_BACKEND_BASE_ENDPOINT || "";

  // normalize URL parts to avoid double slashes
  const baseClean = base ? base.replace(/\/\/+$/, "") : "";
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // If no base provided, use relative path (works with Vite proxy)
  const url = baseClean ? `${baseClean}${path}` : path;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  };

  if (token) {
    defaultOptions.headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    return await fetch(url, defaultOptions);
  } catch (err) {
    console.error("Network request failed:", url, err);
    throw err;
  }
}
