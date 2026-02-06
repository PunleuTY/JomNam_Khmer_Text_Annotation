// Helper function to get the stored Firebase token from localStorage
export function getAuthToken() {
  return localStorage.getItem("firebaseToken");
}

// Helper function to save Firebase token to localStorage
export function setAuthTokenInStorage(token) {
  localStorage.setItem("firebaseToken", token);
}

// Helper function to clear Firebase token from localStorage
export function clearAuthTokenFromStorage() {
  localStorage.removeItem("firebaseToken");
}
