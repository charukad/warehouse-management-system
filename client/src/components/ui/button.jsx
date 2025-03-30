// client/src/components/ui/button.jsx
import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "medium",
  className = "",
  ...props
}) => {
  // Define styles based on variant
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline:
      "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700",
  };

  // Define styles based on size
  const sizeClasses = {
    small: "py-1 px-3 text-sm",
    medium: "py-2 px-4",
    large: "py-3 px-6 text-lg",
  };

  // Combine all classes
  // client/src/components/ui/button.jsx (continued)
  // Combine all classes
  const buttonClasses = `
    rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
    font-medium transition-colors
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.medium}
    ${props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    ${className}
  `;

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
