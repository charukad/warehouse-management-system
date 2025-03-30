// client/src/pages/auth/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../contexts/AuthContext";
import { AlertCircle } from "lucide-react";

// Validation schema
const schema = yup.object().shape({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),

  fullName: yup
    .string()
    .required("Full name is required")
    .max(50, "Full name must be less than 50 characters"),

  email: yup
    .string()
    .required("Email is required")
    .email("Must be a valid email"),

  contactNumber: yup
    .string()
    .required("Contact number is required")
    .matches(/^[0-9+\-\s]+$/, "Please provide a valid contact number"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must include uppercase, lowercase, number and special character"
    ),

  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),

  role: yup
    .string()
    .required("Role is required")
    .oneOf(["owner", "warehouse_manager", "salesman", "shop"], "Invalid role"),
});

const Register = () => {
  const {
    register: registerUser,
    isAuthenticated,
    error: authError,
  } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError("");

      // Create a copy of data and remove confirmPassword
      const userData = { ...data };
      delete userData.confirmPassword;

      await registerUser(userData);
      // On success, the useEffect will handle redirection
    } catch (err) {
      // Handle different types of errors
      if (err.response) {
        // Server returned an error response
        const serverError = err.response.data;

        if (serverError.errors && Array.isArray(serverError.errors)) {
          // Handle validation errors from the server
          setError(serverError.errors.map((e) => e.msg).join(", "));
        } else if (serverError.message) {
          // Handle standard error message
          setError(serverError.message);
        } else {
          // Generic error for other response errors
          setError(`Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        // Request was made but no response received (network error)
        setError("Network error. Please check your connection and try again.");
      } else if (err.customMessage) {
        // Use custom message if available (from your auth context)
        setError(err.customMessage);
      } else {
        // For any other type of error
        setError("Registration failed. Please try again.");
      }

      // Log the full error for debugging
      console.error("Registration error:", err);

      // No need to reset the form on error so the user can fix and resubmit
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 py-10">
      <div className="m-auto max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Sathira Sweet</h1>
          <p className="text-gray-600 mt-2">Create a new account</p>
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
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              className={`input w-full ${
                errors.username ? "border-red-500" : ""
              }`}
              placeholder="Username"
              {...register("username")}
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              className={`input w-full ${
                errors.fullName ? "border-red-500" : ""
              }`}
              placeholder="Full Name"
              {...register("fullName")}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`input w-full ${errors.email ? "border-red-500" : ""}`}
              placeholder="Email"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="contactNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contact Number
            </label>
            <input
              id="contactNumber"
              type="text"
              className={`input w-full ${
                errors.contactNumber ? "border-red-500" : ""
              }`}
              placeholder="Contact Number"
              {...register("contactNumber")}
              disabled={isLoading}
            />
            {errors.contactNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.contactNumber.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              className={`input w-full ${errors.role ? "border-red-500" : ""}`}
              {...register("role")}
              disabled={isLoading}
            >
              <option value="">Select Role</option>
              <option value="owner">Owner</option>
              <option value="warehouse_manager">Warehouse Manager</option>
              <option value="salesman">Delivery Salesman</option>
              <option value="shop">Shop</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`input w-full ${
                errors.password ? "border-red-500" : ""
              }`}
              placeholder="Password"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={`input w-full ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
              placeholder="Confirm Password"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
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
                Registering...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
