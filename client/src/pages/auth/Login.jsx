// client/src/pages/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../contexts/AuthContext";
import { AlertCircle } from "lucide-react";

// Validation schema
const schema = yup.object().shape({
  username: yup.string().required("Username or email is required"),
  password: yup.string().required("Password is required"),
});

const Login = () => {
  const { login, isAuthenticated, error: authError } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from query params or localStorage
  const redirectPath =
    new URLSearchParams(location.search).get("redirect") ||
    localStorage.getItem("redirectAfterLogin") ||
    "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Check for session expired message in URL
  useEffect(() => {
    const expired = new URLSearchParams(location.search).get("expired");
    if (expired === "true") {
      setError("Your session has expired. Please log in again.");
    }

    // Clear the stored redirect path once used
    if (isAuthenticated) {
      localStorage.removeItem("redirectAfterLogin");
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, location.search, redirectPath]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError("");
      await login(data);

      // Redirect will happen automatically due to the useEffect
    } catch (err) {
      setError(
        err.customMessage || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="m-auto max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Sathira Sweet</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Error alert */}
        {(error || authError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error || authError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              className={`input w-full ${
                errors.username ? "border-red-500" : ""
              }`}
              placeholder="Enter your username or email"
              {...register("username")}
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className={`input w-full ${
                errors.password ? "border-red-500" : ""
              }`}
              placeholder="Enter your password"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
