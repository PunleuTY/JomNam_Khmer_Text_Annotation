import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "Auth state changed:",
        user ? "User logged in" : "User logged out"
      );

      if (user) {
        // Get Firebase token and set secure cookie
        try {
          const token = await user.getIdToken();
          await setAuthCookie(token);
          setUser(user);
          console.log("User authenticated successfully:", user.email);
        } catch (error) {
          console.error("Failed to set auth cookie:", error);
          // Sign out if cookie setting fails
          await signOut(auth);
        }
      } else {
        // Clear cookie on logout
        await clearAuthCookie();
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
      // Cookie will be cleared by the auth state listener
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Helper function to set secure cookie via backend
async function setAuthCookie(token) {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}/auth/set-cookie`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ token }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to set auth cookie");
  }
}

// Helper function to clear cookie via backend
async function clearAuthCookie() {
  try {
    await fetch(`${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to clear auth cookie:", error);
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
