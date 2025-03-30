// client/src/components/common/Tabs.jsx
import React, { createContext, useContext } from "react";

// Create context for tab state
const TabContext = createContext(null);

export const Tabs = ({ children, activeTab, onChange }) => {
  return (
    <TabContext.Provider value={{ activeTab, onChange }}>
      <div className="tabs-container">{children}</div>
    </TabContext.Provider>
  );
};

export const TabList = ({ children }) => {
  return <div className="flex border-b">{children}</div>;
};

export const Tab = ({ id, children }) => {
  const { activeTab, onChange } = useContext(TabContext);
  const isActive = id === activeTab;

  return (
    <button
      className={`py-2 px-4 font-medium text-sm focus:outline-none ${
        isActive
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={() => onChange(id)}
    >
      {children}
    </button>
  );
};

export const TabPanel = ({ id, children }) => {
  const { activeTab } = useContext(TabContext);

  if (id !== activeTab) return null;

  return <div className="py-4">{children}</div>;
};
