import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { signup, loginWithGoogle } from "@/lib/auth/index";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";

const Signup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
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

  // Handle default signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSigningUp(true);
    console.log("Signup form submitted:", formData);

    try {
      const response = await signup(formData.email, formData.password);
      if (response.success) {
        console.log("Signup successful:", response.user);
        toast.success("Account created successfully!");
        // Navigation will be handled by useEffect when auth state updates
      } else {
        console.error("Error signup: ", response.error);
        toast.error("Failed to create account: " + response.error);
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An error occurred during signup");
    } finally {
      setIsSigningUp(false);
    }
  };

  // Handle google signup
  const handleGoogleSignup = async () => {
    setIsSigningUp(true);

    try {
      const response = await loginWithGoogle();
      if (response.success) {
        console.log("Google signup successful:", response.user);
        toast.success("Account created successfully!");
        // Navigation will be handled by useEffect when auth state updates
      } else {
        console.error("Error google signup: ", response.error);
        toast.error("Failed to create account with Google: " + response.error);
      }
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error("An error occurred during Google signup");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto bg-[#12284C] p-8 rounded-lg shadow-lg">
        {/* Title */}
        <h1 className="text-[#F88F2D] text-3xl font-bold text-center mb-8">
          CREATE ACCOUNT
        </h1>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Full Name Field */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              FULL NAME
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-[#1a3555] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F88F2D] focus:border-transparent"
              required
            />
          </div>

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

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isSigningUp || loading}
            className="w-full bg-[#F88F2D] text-[#12284C] font-bold py-3 px-4 rounded-md hover:bg-[#e67e26] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#F88F2D] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningUp ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        {/* Google Signup Button */}
        <button
          onClick={handleGoogleSignup}
          disabled={isSigningUp || loading}
          className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-md hover:bg-gray-50 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle size={20} />
          {isSigningUp ? "Creating account..." : "Sign Up with Google"}
        </button>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <span className="text-gray-400">Already have an account? </span>
          <a
            href="/login"
            className="text-[#F88F2D] font-medium hover:underline"
          >
            SIGN IN
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
