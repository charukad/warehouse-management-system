// client/src/store/slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    // Add reducers later
  },
});

export default userSlice.reducer;
