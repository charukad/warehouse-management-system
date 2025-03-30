// client/src/components/ui/select.jsx
import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";

// Create context for the select state
const SelectContext = createContext(null);

export const Select = ({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className = "",
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(
    value || defaultValue || ""
  );

  // Handle external value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    }

    if (value === undefined) {
      setSelectedValue(newValue);
    }

    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value: selectedValue,
        onChange: handleValueChange,
        disabled,
      }}
    >
      <div className={`relative ${className}`} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ children, className = "", ...props }) => {
  const { open, setOpen, disabled } = useContext(SelectContext);

  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        open ? "border-blue-500 ring-2 ring-blue-500" : ""
      } ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${className}`}
      onClick={() => !disabled && setOpen(!open)}
      aria-expanded={open}
      disabled={disabled}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`ml-2 h-4 w-4 transition-transform ${
          open ? "rotate-180" : ""
        }`}
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  );
};

export const SelectValue = ({
  placeholder = "Select an option",
  className = "",
  ...props
}) => {
  const { value } = useContext(SelectContext);

  return (
    <span
      className={`block truncate ${value ? "" : "text-gray-400"} ${className}`}
      {...props}
    >
      {value || placeholder}
    </span>
  );
};

export const SelectContent = ({ children, className = "", ...props }) => {
  const { open, setOpen } = useContext(SelectContext);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({ children, value, className = "", ...props }) => {
  const { value: selectedValue, onChange } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      className={`relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm ${
        isSelected
          ? "bg-blue-100 text-blue-900"
          : "text-gray-900 hover:bg-gray-100"
      } ${className}`}
      onClick={() => onChange(value)}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      )}
      {children}
    </div>
  );
};

// Add these additional components that might be imported by Reports.jsx
export const SelectGroup = ({ children, className = "", ...props }) => {
  return (
    <div className={`py-1 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const SelectLabel = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`px-3 py-1 text-xs font-semibold text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const SelectSeparator = ({ className = "", ...props }) => {
  return <div className={`my-1 h-px bg-gray-200 ${className}`} {...props} />;
};

// Default export for convenience
export default Select;
