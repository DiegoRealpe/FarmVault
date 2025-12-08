import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";
import deviceReducer from "../features/devices/deviceSlice";
import userAccessReducer from "../features/grants/userAccessSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    devices: deviceReducer,
    userAccess: userAccessReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
