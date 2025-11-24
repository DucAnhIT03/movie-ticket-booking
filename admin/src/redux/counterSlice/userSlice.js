import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateInfo: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("infoState", JSON.stringify(state.user));
    },
    loadInfo: (state) => {
      const saved = localStorage.getItem("infoState");
      if (saved) {
        state.user = JSON.parse(saved);
      }
    },
    clearInfo: (state) => {
      state.user = null;
      localStorage.removeItem("infoState");
    },
  },
});

export const { updateInfo, loadInfo, clearInfo } = userSlice.actions;
export default userSlice.reducer;
