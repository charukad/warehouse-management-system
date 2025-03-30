// client/src/components/ui/tabs.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

// Create context for tab state management
const TabsContext = createContext(null);

// The main Tabs container component
export const Tabs = ({
  children,
  defaultValue,
  value,
  onValueChange,
  className = "",
  ...props
}) => {
  // Use controlled value if provided, otherwise use internal state with defaultValue
  const [selectedTab, setSelectedTab] = useState(
    value !== undefined ? value : defaultValue
  );

  // Update internal state if controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedTab(value);
    }
  }, [value]);

  // Handle tab selection
  const handleValueChange = (newValue) => {
    if (onValueChange) {
      // If controlled, notify parent component
      onValueChange(newValue);
    }
    if (value === undefined) {
      // If uncontrolled, update internal state
      setSelectedTab(newValue);
    }
  };

  // Create value object to pass to context
  const contextValue = {
    selectedTab,
    onValueChange: handleValueChange,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// The container for tab triggers/buttons
export const TabsList = ({ children, className = "", ...props }) => {
  return (
    <div
      role="tablist"
      className={`flex space-x-1 rounded-lg bg-gray-100 p-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// The individual tab button/trigger
export const TabsTrigger = ({
  children,
  value,
  disabled = false,
  className = "",
  ...props
}) => {
  const { selectedTab, onValueChange } = useContext(TabsContext);
  const isSelected = selectedTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      disabled={disabled}
      data-state={isSelected ? "active" : "inactive"}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all
        ${
          isSelected
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${className}`}
      onClick={() => !disabled && onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

// The content panel for each tab
export const TabsContent = ({ children, value, className = "", ...props }) => {
  const { selectedTab } = useContext(TabsContext);
  const isSelected = selectedTab === value;

  // Only render content when the tab is selected
  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      className={`mt-2 ${className}`}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
};

// Export a default for convenience
export default Tabs;
