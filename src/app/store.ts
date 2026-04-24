import { configureStore } from "@reduxjs/toolkit";

import deviceReducer from "../features/devices/deviceSlice";
import grantRecordReducer from "../features/grants/grantRecordSlice";
import metricsReducer from "../features/metrics/metricsSlice";
import userReducer from "../features/user/userSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    devices: deviceReducer,
    metrics: metricsReducer,
    grantRecord: grantRecordReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
