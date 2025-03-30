// client/src/components/ui/popover.jsx
import React, { useState, useRef, useEffect } from "react";

export const Popover = ({ children, className = "", ...props }) => {
  return (
    <div className={`relative inline-block ${className}`} {...props}>
      {children}
    </div>
  );
};

export const PopoverTrigger = ({
  children,
  onClick,
  className = "",
  ...props
}) => {
  return React.cloneElement(children, {
    ...props,
    className: `${children.props.className || ""} ${className}`,
    onClick: (e) => {
      if (onClick) onClick(e);
      if (children.props.onClick) children.props.onClick(e);
    },
  });
};

export const PopoverContent = ({
  children,
  className = "",
  align = "center",
  sideOffset = 4,
  show = false,
  onClose,
  ...props
}) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) return null;

  // Alignment class
  const alignClass =
    {
      start: "left-0",
      center: "left-1/2 transform -translate-x-1/2",
      end: "right-0",
    }[align] || "left-1/2 transform -translate-x-1/2";

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-${sideOffset} w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
