// client/src/contexts/UIContext.jsx

import React, { createContext, useState, useEffect } from "react";

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState([]);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications([...notifications, { id, ...notification }]);

    // Auto-remove notification after timeout
    if (notification.timeout !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout || 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  return (
    <UIContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        theme,
        toggleTheme,
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
