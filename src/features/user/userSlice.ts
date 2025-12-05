import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "admin" | "temp";

export interface UserState {
  name: string | null;
  role: UserRole | null;
  loggedIn: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  name: null,
  role: null,
  loggedIn: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(
      state,
      action: PayloadAction<{ name: string; role: UserRole }>
    ) {
      state.loading = false;
      state.loggedIn = true;
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.loggedIn = false;
      state.name = null;
      state.role = null;
    },
    logout(state) {
      state.name = null;
      state.role = null;
      state.loggedIn = false;
      state.loading = false;
      state.error = null;
    },
    hydrateFromStorage(
      state,
      action: PayloadAction<{
        name: string | null;
        role: UserRole | null;
      }>
    ) {
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.loggedIn = !!action.payload.name;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  hydrateFromStorage,
} = userSlice.actions;

export default userSlice.reducer;
