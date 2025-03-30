// client/src/components/ui/input.jsx
import React from "react";

export const Input = ({ className = "", type = "text", error, ...props }) => {
  return (
    <div className="w-full">
      <input
        type={type}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? "border-red-300" : "border-gray-300"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
