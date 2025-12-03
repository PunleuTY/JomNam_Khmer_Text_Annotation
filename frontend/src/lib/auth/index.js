// Auth utilities
export { auth } from "./firebase";

// Email/Password auth
export { signup, login, logout as logoutEmail } from "./emailPassAuth";

// Google auth
export { loginWithGoogle, logout as logoutGoogle } from "./googleAuth";

// Unified logout (can use either)
export { logout } from "./emailPassAuth";
