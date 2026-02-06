import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/auth";
import {
  getAuthToken,
  setAuthTokenInStorage,
  clearAuthTokenFromStorage,
} from "@/lib/authUtils";

const AuthContext = createContext();

export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const savedToken = getAuthToken();
    if (savedToken) {
      setToken(savedToken);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "Auth state changed:",
        user ? "User logged in" : "User logged out",
      );

      if (user) {
        // Get Firebase token and save to localStorage
        try {
          const idToken = await user.getIdToken();

          // Save token to localStorage for persistence across page reloads
          setAuthTokenInStorage(idToken);
          setToken(idToken);
          setUser(user);

          console.log("User authenticated successfully:", user.email);
        } catch (error) {
          console.error("Failed to get ID token:", error);
          await signOut(auth);
        }
      } else {
        // Clear token on logout
        clearAuthTokenFromStorage();
        setToken(null);
        setUser(null);
        console.log("User signed out successfully");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Token will be cleared by the auth state listener
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    token,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
