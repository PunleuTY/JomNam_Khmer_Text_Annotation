import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { login, loginWithGoogle } from "../lib/auth/index";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    console.log(
      "Login useEffect - isAuthenticated:",
      isAuthenticated,
      "loading:",
      loading
    );
    if (isAuthenticated && !loading) {
      console.log("Navigating to home page...");
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle default login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    console.log("Login form submitted:", formData);

    try {
      const response = await login(formData.email, formData.password);
      if (response.success) {
        console.log("Login successful:", response.user);
      } else {
        console.error("Error login: ", response.error);
        toast.error("Failed to login: " + response.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle google login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);

    try {
      const response = await loginWithGoogle();
      if (response.success) {
        console.log("Google login successful:", response.user);
      } else {
        console.error("Error google login: ", response.error);
        toast.error("Failed to login with Google: " + response.error);
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("An error occurred during Google login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto bg-[#12284C] p-8 rounded-lg shadow-lg">
        {/* Title */}
        <h1 className="text-[#F88F2D] text-3xl font-bold text-center mb-8">
          LOGIN
        </h1>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-[#1a3555] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F88F2D] focus:border-transparent"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••••"
                className="w-full px-4 py-3 pr-12 bg-[#1a3555] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F88F2D] focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none"
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoggingIn || loading}
            className="w-full bg-[#F88F2D] text-[#12284C] font-bold py-3 px-4 rounded-md hover:bg-[#e67e26] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#F88F2D] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn || loading}
          className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-md hover:bg-gray-50 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle size={20} />
          {isLoggingIn ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <span className="text-gray-400">Don't have an account? </span>
          <a
            href="/signup"
            className="text-[#F88F2D] font-medium hover:underline"
          >
            SIGN UP
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
