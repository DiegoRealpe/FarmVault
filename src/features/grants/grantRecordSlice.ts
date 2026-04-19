import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>({
  authMode: "userPool",
});

type GrantRecord = Schema["GrantRecord"]["type"];
type GrantType = "farm" | "device";

export type GrantRecordSortBy =
  | "userSub"
  | "expiresAt"
  | "ttl"
  | "createdBySub"
  | "createdAt"
  | "updatedAt";

export type GrantRecordSortDirection = "asc" | "desc";

export interface GrantEntry {
  grantType: GrantType;
  ids: string[];
}

export interface CreateFarmUserInput {
  email: string;
  temporaryPassword: string;
}

export interface CreateFarmUserResult {
  success: boolean;
  username: string;
  userSub: string | null;
  assignedGroup: string;
}

export interface UpsertGrantRecordInput {
  userSub: string;
  grants: GrantEntry[];
  expiresAt: string;
}

interface GrantRecordState {
  grantRecord: GrantRecord | null;
  createdGrantRecords: GrantRecord[];
  loadingGrantRecord: boolean;
  loadingCreatedGrantRecords: boolean;
  creatingUser: boolean;
  upsertingGrantRecord: boolean;
  error: string | null;
  filters: {
    showExpired: boolean;
    sortBy: GrantRecordSortBy;
    sortDirection: GrantRecordSortDirection;
  };
}

const initialState: GrantRecordState = {
  grantRecord: null,
  createdGrantRecords: [],
  loadingGrantRecord: false,
  loadingCreatedGrantRecords: false,
  creatingUser: false,
  upsertingGrantRecord: false,
  error: null,
  filters: {
    showExpired: false,
    sortBy: "createdAt",
    sortDirection: "desc",
  },
};

export const fetchGrantRecord = createAsyncThunk<
  GrantRecord | null,
  void,
  { rejectValue: string }
>("grantRecord/fetchGrantRecord", async (_, { rejectWithValue }) => {
  try {
    const { data, errors } =
      await client.queries.getPersonalGrantRecord({});

    if (errors?.length) {
      return rejectWithValue(errors.map((e) => e.message).join("; "));
    }

    return (data as GrantRecord | null) ?? null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch grant record",
    );
  }
});

export const fetchCreatedGrantRecords = createAsyncThunk<
  GrantRecord[],
  void,
  { rejectValue: string }
>("grantRecord/fetchCreatedGrantRecords", async (_, { rejectWithValue }) => {
  try {
    const response = await client.queries.listCreatedGrantRecords({});
    const { data, errors } = response;

    if (errors?.length) {
      const errorMessage = errors.map((e) => e.message).join("; ");
      return rejectWithValue(errorMessage);
    }
    const result = (data as GrantRecord[] | null) ?? [];

    return result;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch created grant records",
    );
  }
});

export const createFarmUserThunk = createAsyncThunk<
  CreateFarmUserResult,
  CreateFarmUserInput,
  { rejectValue: string }
>("grantRecord/createFarmUser", async (input, { rejectWithValue }) => {
  try {
    const { data, errors } = await client.mutations.createFarmUser({
      email: input.email,
      temporaryPassword: input.temporaryPassword,
    });

    if (errors?.length) {
      return rejectWithValue(errors.map((e: { message: any }) => e.message).join("; "));
    }

    if (!data) {
      return rejectWithValue("No user was returned from createFarmUser");
    }

    return data as CreateFarmUserResult;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create farm user",
    );
  }
});

export const upsertGrantRecordThunk = createAsyncThunk<
  GrantRecord,
  UpsertGrantRecordInput,
  { rejectValue: string }
>("grantRecord/upsertGrantRecord", async (input, { rejectWithValue }) => {
  try {
    const { data, errors } = await client.mutations.upsertGrantRecord({
      userSub: input.userSub,
      grants: input.grants,
      expiresAt: input.expiresAt,
    });

    if (errors?.length) {
      return rejectWithValue(errors.map((e: { message: any }) => e.message).join("; "));
    }

    if (!data) {
      return rejectWithValue(
        "No grant record was returned from upsertGrantRecord",
      );
    }

    return data as GrantRecord;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to upsert grant record",
    );
  }
});

const grantRecordSlice = createSlice({
  name: "grantRecord",
  initialState,
  reducers: {
    setShowExpired: (state, action: PayloadAction<boolean>) => {
      state.filters.showExpired = action.payload;
    },

    setSortBy: (state, action: PayloadAction<GrantRecordSortBy>) => {
      state.filters.sortBy = action.payload;
    },

    setSortDirection: (
      state,
      action: PayloadAction<GrantRecordSortDirection>,
    ) => {
      state.filters.sortDirection = action.payload;
    },

    toggleSort: (state, action: PayloadAction<GrantRecordSortBy>) => {
      const nextSortBy = action.payload;

      if (state.filters.sortBy === nextSortBy) {
        state.filters.sortDirection =
          state.filters.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.filters.sortBy = nextSortBy;
        state.filters.sortDirection = "asc";
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    clearGrantRecord: (state) => {
      state.grantRecord = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchGrantRecord.pending, (state) => {
        state.loadingGrantRecord = true;
        state.error = null;
      })
      .addCase(fetchGrantRecord.fulfilled, (state, action) => {
        state.loadingGrantRecord = false;
        state.grantRecord = action.payload;
      })
      .addCase(fetchGrantRecord.rejected, (state, action) => {
        state.loadingGrantRecord = false;
        state.error = action.payload ?? "Failed to fetch grant record";
      })

      .addCase(fetchCreatedGrantRecords.pending, (state) => {
        state.loadingCreatedGrantRecords = true;
        state.error = null;
      })
      .addCase(fetchCreatedGrantRecords.fulfilled, (state, action) => {
        state.loadingCreatedGrantRecords = false;
        state.createdGrantRecords = action.payload;
      })
      .addCase(fetchCreatedGrantRecords.rejected, (state, action) => {
        state.loadingCreatedGrantRecords = false;
        state.error = action.payload ?? "Failed to fetch created grant records";
      })

      .addCase(createFarmUserThunk.pending, (state) => {
        state.creatingUser = true;
        state.error = null;
      })
      .addCase(createFarmUserThunk.fulfilled, (state) => {
        state.creatingUser = false;
      })
      .addCase(createFarmUserThunk.rejected, (state, action) => {
        state.creatingUser = false;
        state.error = action.payload ?? "Failed to create farm user";
      })

      .addCase(upsertGrantRecordThunk.pending, (state) => {
        state.upsertingGrantRecord = true;
        state.error = null;
      })
      .addCase(upsertGrantRecordThunk.fulfilled, (state, action) => {
        state.upsertingGrantRecord = false;
        state.grantRecord = action.payload;

        const existingIndex = state.createdGrantRecords.findIndex(
          (record) => record.userSub === action.payload.userSub,
        );

        if (existingIndex >= 0) {
          state.createdGrantRecords[existingIndex] = action.payload;
        } else {
          state.createdGrantRecords.unshift(action.payload);
        }
      })
      .addCase(upsertGrantRecordThunk.rejected, (state, action) => {
        state.upsertingGrantRecord = false;
        state.error = action.payload ?? "Failed to upsert grant record";
      });
  },
});

export const {
  setShowExpired,
  setSortBy,
  setSortDirection,
  toggleSort,
  clearError,
  clearGrantRecord,
} = grantRecordSlice.actions;

export default grantRecordSlice.reducer;