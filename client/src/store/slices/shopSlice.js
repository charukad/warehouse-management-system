// client/src/store/slices/shopSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  shops: [],
  nearbyShops: [],
  loading: false,
  error: null,
};

const shopSlice = createSlice({
  name: "shops",
  initialState,
  reducers: {
    // Add reducers later
  },
});

export default shopSlice.reducer;
