// features/grants/userAccessSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

type UserAccess = Schema['UserAccess']['type'];

interface UserAccessState {
  grants: UserAccess[];
  loading: boolean;
  error: string | null;
  filters: {
    showExpired: boolean;
    sortBy: 'createdAt' | 'expiresAt';
  };
}

const initialState: UserAccessState = {
  grants: [],
  loading: false,
  error: null,
  filters: {
    showExpired: false,
    sortBy: 'createdAt',
  },
};

export const fetchUserGrants = createAsyncThunk(
  'userAccess/fetchUserGrants',
  async (userSub: string, { rejectWithValue }) => {
    try {
      // We need to query UserAccess where createdBySub = userSub
      // Note: You might need to create a custom query in your backend
      // For now, we'll use list and filter client-side
      const response = await client.models.UserAccess.list({
        filter: {
          createdBySub: { eq: userSub }
        }
      });
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch grants');
    }
  }
);

export const createGrant = createAsyncThunk(
  'userAccess/createGrant',
  async (grantData: {
    userSub: string;
    farmId: string;
    datasetKeys: string[];
    deviceIds?: string[];
    expiresAt: string;
    ttl: number;
  }, { rejectWithValue }) => {
    try {
      const response = await client.models.UserAccess.create({
        ...grantData,
        createdBySub: 'current-user-sub', // This should come from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create grant');
    }
  }
);

const userAccessSlice = createSlice({
  name: 'userAccess',
  initialState,
  reducers: {
    setShowExpired: (state, action: PayloadAction<boolean>) => {
      state.filters.showExpired = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'createdAt' | 'expiresAt'>) => {
      state.filters.sortBy = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserGrants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserGrants.fulfilled, (state, action) => {
        state.loading = false;
        state.grants = action.payload;
      })
      .addCase(fetchUserGrants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createGrant.fulfilled, (state, action) => {
        if (action.payload) {
          state.grants.unshift(action.payload);
        }
      });
  },
});

export const { setShowExpired, setSortBy, clearError } = userAccessSlice.actions;
export default userAccessSlice.reducer;