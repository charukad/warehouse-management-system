// client/src/hooks/useUI.js
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setSearchQuery,
} from "../store/slices/uiSlice";

export const useUI = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, darkMode, searchQuery, isOnline } = useSelector(
    (state) => state.ui
  );

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleSetSidebarOpen = useCallback(
    (isOpen) => {
      dispatch(setSidebarOpen(isOpen));
    },
    [dispatch]
  );

  const handleToggleDarkMode = useCallback(() => {
    dispatch(toggleDarkMode());
  }, [dispatch]);

  const handleSetSearchQuery = useCallback(
    (query) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  return {
    sidebarOpen,
    darkMode,
    searchQuery,
    isOnline,
    toggleSidebar: handleToggleSidebar,
    setSidebarOpen: handleSetSidebarOpen,
    toggleDarkMode: handleToggleDarkMode,
    setSearchQuery: handleSetSearchQuery,
  };
};
