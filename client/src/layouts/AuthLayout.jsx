// client/src/layouts/AuthLayout.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import { useUI } from "../hooks/useUI";
import NotificationContainer from "../components/common/NotificationContainer";

const AuthLayout = () => {
  const { notifications } = useUI();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sathira Sweet Management System
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>

      <NotificationContainer notifications={notifications} />
    </div>
  );
};

export default AuthLayout;
