// client/src/store/slices/inventorySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  inventory: [],
  salesmanInventory: [],
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    // Add reducers later
  },
});

export default inventorySlice.reducer;
