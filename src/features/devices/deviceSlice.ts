import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

type Device = Schema['IoTDeviceView']['type'];

interface DeviceState {
  devices: Device[];
  farmId: string;
  loading: boolean;
  error: string | null;
}

const initialState: DeviceState = {
  devices: [],
  farmId: 'farm-001', // Default farm ID
  loading: false,
  error: null,
};

// Async thunk to fetch devices
export const fetchDevices = createAsyncThunk<Device[], string, { rejectValue: string }>(
  'devices/fetchDevices',
  async (farmId: string, { rejectWithValue }) => {
    try {
      const response = await client.queries.listAllDevices({ farmId });
      return (response.data ?? []) as Device[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch devices');
    }
  }
);

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setFarmId: (state, action: PayloadAction<string>) => {
      state.farmId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetDevices: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchDevices pending
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle fetchDevices fulfilled
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
        if (action.payload.length === 0) {
          state.error = `No devices found for farm: ${state.farmId}`;
        }
      })
      // Handle fetchDevices rejected
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.devices = [];
        state.error = action.payload as string || 'Failed to fetch devices';
      });
  },
});

export const { setFarmId, clearError, resetDevices } = deviceSlice.actions;
export default deviceSlice.reducer;