import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";
import deviceReducer from "../features/devices/deviceSlice";
import grantRecordReducer from "../features/grants/grantRecordSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    devices: deviceReducer,
    grantRecord: grantRecordReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
