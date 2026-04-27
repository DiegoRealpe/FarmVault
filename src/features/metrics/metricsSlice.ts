import { generateClient } from "aws-amplify/data";

import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

export type MetricsViewMode = "table" | "graph";

type TimeSeriesPoint = Schema["TimeSeriesPoint"]["type"];
type DeviceTimeSeries = Schema["DeviceTimeSeries"]["type"];

interface MetricsState {
  selectedDeviceId: string;
  viewMode: MetricsViewMode;
  from: string;
  to: string;
}

interface FetchMetricsArgs {
  deviceId: string;
  from: string;
  to: string;
}

const now = new Date();
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const initialState: MetricsState = {
  selectedDeviceId: "",
  viewMode: "table",
  from: sevenDaysAgo.toISOString(),
  to: now.toISOString(),
};

const getSafePastIso = (value: string): string => {
  const parsedTime = new Date(value).getTime();
  const safeTime = Number.isNaN(parsedTime) ? Date.now() : parsedTime;

  return new Date(Math.min(safeTime, Date.now())).toISOString();
};

export const fetchMetricsForDevice = createAsyncThunk<
  TimeSeriesPoint[],
  FetchMetricsArgs,
  { rejectValue: string }
>(
  "metrics/fetchMetricsForDevice",
  async ({ deviceId, from, to }, thunkApi) => {
    try {
      const result = await client.queries.getFarmIotData(
        {
          deviceId,
          from,
          to,
        },
        {
          authMode: "userPool",
        }
      );

      console.log("[metricsSlice] result.data:", result.data);
      console.log("[metricsSlice] result.errors:", result.errors);

      if (result.errors?.length) {
        return thunkApi.rejectWithValue(result.errors[0].message);
      }

      const series = (result.data ?? []).filter(
        (item): item is DeviceTimeSeries => item != null
      );

      const points =
        series[0]?.points?.filter(
          (point): point is TimeSeriesPoint => point != null
        ) ?? [];
      console.log("[metricsSlice] points:", points);
      return points;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch metrics."
      );
    }
  }
);

const metricsSlice = createSlice({
  name: "metrics",
  initialState,
  reducers: {
    setSelectedDeviceId(state, action: PayloadAction<string>) {
      state.selectedDeviceId = action.payload;
    },

    setMetricsViewMode(
      state,
      action: PayloadAction<MetricsViewMode>
    ) {
      state.viewMode = action.payload;
    },

    setFrom(state, action: PayloadAction<string>) {
      const nextFrom = getSafePastIso(action.payload);

      state.from = nextFrom;

      if (
        new Date(nextFrom).getTime() > new Date(state.to).getTime()
      ) {
        state.to = nextFrom;
      }
    },

    setTo(state, action: PayloadAction<string>) {
      const nextTo = getSafePastIso(action.payload);

      state.to = nextTo;

      if (
        new Date(state.from).getTime() > new Date(nextTo).getTime()
      ) {
        state.from = nextTo;
      }
    },

    resetMetricsFilters(state) {
      const resetNow = new Date();
      const resetSevenDaysAgo = new Date();
      resetSevenDaysAgo.setDate(resetSevenDaysAgo.getDate() - 7);

      state.from = resetSevenDaysAgo.toISOString();
      state.to = resetNow.toISOString();
    },
  },
});

export const {
  setSelectedDeviceId,
  setMetricsViewMode,
  setFrom,
  setTo,
  resetMetricsFilters,
} = metricsSlice.actions;

export default metricsSlice.reducer;
