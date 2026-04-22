import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Schema } from "../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>({
  authMode: "userPool",
});

type IoTDevice = Schema["IoTDevice"]["type"];
type Farm = Schema["Farm"]["type"];

interface DeviceState {
  visibleDevices: IoTDevice[];
  visibleFarms: Farm[];
  loadingVisibleDevices: boolean;
  loadingVisibleFarms: boolean;
  visibleDevicesError: string | null;
  visibleFarmsError: string | null;
}
const initialState: DeviceState = {
  visibleDevices: [],
  visibleFarms: [],
  loadingVisibleDevices: false,
  loadingVisibleFarms: false,
  visibleDevicesError: null,
  visibleFarmsError: null,
};

export const fetchVisibleDevices = createAsyncThunk<
  IoTDevice[],
  void,
  { rejectValue: string }
>("devices/fetchVisibleDevices", async (_, { rejectWithValue }) => {
  try {
    const response = await client.queries.listVisibleDevices({});

    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }

    const devices = (response.data ?? []) as IoTDevice[];

    return devices.filter(
      (device): device is IoTDevice =>
        device != null && typeof device === "object",
    );
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch visible devices",
    );
  }
});
export const fetchVisibleFarms = createAsyncThunk<
  Farm[],
  void,
  { rejectValue: string }
>("devices/fetchVisibleFarms", async (_, { rejectWithValue }) => {
  try {
    const response = await client.queries.listVisibleFarms({});
    console.log("[fetchVisibleFarms] response:", response);

    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }

    const farms = (response.data ?? []) as Farm[];

    return farms.filter(
      (farm): farm is Farm => farm != null && typeof farm === "object",
    );
  } catch (error) {
    console.error("[fetchVisibleFarms] error:", error);
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch visible farms",
    );
  }
});

const deviceSlice = createSlice({
  name: "devices",
  initialState,
  reducers: {
    clearVisibleResourceErrors: (state) => {
      state.visibleDevicesError = null;
      state.visibleFarmsError = null;
    },
    resetVisibleResourcesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisibleDevices.pending, (state) => {
        state.loadingVisibleDevices = true;
        state.visibleDevicesError = null;
      })
      .addCase(fetchVisibleDevices.fulfilled, (state, action) => {
        state.loadingVisibleDevices = false;
        state.visibleDevices = action.payload;
      })
      .addCase(fetchVisibleDevices.rejected, (state, action) => {
        state.loadingVisibleDevices = false;
        state.visibleDevices = [];
        state.visibleDevicesError =
          action.payload ?? "Failed to fetch visible devices";
      })

      .addCase(fetchVisibleFarms.pending, (state) => {
        state.loadingVisibleFarms = true;
        state.visibleFarmsError = null;
      })
      .addCase(fetchVisibleFarms.fulfilled, (state, action) => {
        state.loadingVisibleFarms = false;
        state.visibleFarms = action.payload;
      })
      .addCase(fetchVisibleFarms.rejected, (state, action) => {
        state.loadingVisibleFarms = false;
        state.visibleFarms = [];
        state.visibleFarmsError =
          action.payload ?? "Failed to fetch visible farms";
      });
  },
});

export const {
  clearVisibleResourceErrors,
  resetVisibleResourcesState,
} = deviceSlice.actions;

export default deviceSlice.reducer;