import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/auth";
import {
  getAuthToken,
  setAuthTokenInStorage,
  clearAuthTokenFromStorage,
} from "@/lib/authUtils";
import { apiRequest } from "@/lib/api";

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

          // Call backend to set auth cookie and create/update MongoDB user record
          try {
            const response = await apiRequest("/auth/set-cookie", {
              method: "POST",
              body: JSON.stringify({ token: idToken }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log("User authenticated successfully:", user.email);
              console.log("MongoDB user record:", data.user);
            } else {
              const error = await response.json();
              console.error("Failed to set auth cookie:", error);
            }
          } catch (error) {
            console.error("Error calling set-cookie endpoint:", error);
          }
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
      // Call backend to clear auth cookie
      try {
        await apiRequest("/api/auth/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Error calling logout endpoint:", error);
      }

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
