// client/src/components/ui/calendar.jsx
import React, { useState } from "react";

export const Calendar = ({
  selectedDate = new Date(),
  onDateChange,
  className = "",
  ...props
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [selected, setSelected] = useState(new Date(selectedDate));

  // Get day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    // Create blank days for start of month
    const blanks = Array(firstDayOfMonth).fill(null);

    // Create days of month
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Combine blanks and days
    return [...blanks, ...days];
  };

  // Format date for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // Handle month navigation
  // client/src/components/ui/calendar.jsx (continued)
  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Handle date selection
  const handleDateClick = (day) => {
    if (!day) return; // Ignore clicks on blank days

    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelected(newDate);

    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // Check if a date is selected
  const isSelected = (day) => {
    if (!day) return false;

    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date.toDateString() === selected.toDateString();
  };

  // Check if a date is today
  const isToday = (day) => {
    if (!day) return false;

    const today = new Date();
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date.toDateString() === today.toDateString();
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <div className={`bg-white rounded-lg shadow ${className}`} {...props}>
      <div className="flex justify-between items-center p-3 border-b">
        <button
          type="button"
          className="p-1 hover:bg-gray-100 rounded"
          onClick={prevMonth}
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="font-medium">{formatMonthYear(currentMonth)}</div>
        <button
          type="button"
          className="p-1 hover:bg-gray-100 rounded"
          onClick={nextMonth}
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs text-gray-500 font-medium py-1"
            >
              {day}
            </div>
          ))}

          {calendarGrid.map((day, index) => (
            <div
              key={index}
              className={`text-center py-1 text-sm ${
                !day ? "text-gray-300" : ""
              }`}
            >
              {day && (
                <button
                  type="button"
                  className={`h-8 w-8 rounded-full focus:outline-none ${
                    isSelected(day)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : isToday(day)
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
