import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./counterSlice/userSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export default store;
