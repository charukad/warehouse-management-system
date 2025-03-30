// client/src/components/common/Loader.jsx
import React from "react";

export const Loader = ({ size = "medium", text = "Loading..." }) => {
  const sizeClass =
    {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12",
    }[size] || "h-8 w-8";

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full ${sizeClass} border-b-2 border-blue-500`}
      ></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );
};

export default Loader;
