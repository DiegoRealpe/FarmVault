import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "admin" | "temporary" | "unknown";

export interface UserState {
  email: string | null;
  role: UserRole;
  groups: string[];
  isAuthenticated: boolean;
}

const initialState: UserState = {
  email: null,
  role: "unknown",
  groups: [],
  isAuthenticated: false,
};

interface SetUserPayload {
  email: string;
  groups: string[];
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserFromAuth(state, action: PayloadAction<SetUserPayload>) {
      const { email, groups } = action.payload;
      state.email = email;
      state.groups = groups;
      state.isAuthenticated = true;

      if (groups.includes("ADMINS")) {
        state.role = "admin";
      } else if (groups.includes("TEMPORARY_USERS")) {
        state.role = "temporary";
      } else {
        state.role = "unknown";
      }
    },
    clearUser(state) {
      state.email = null;
      state.role = "unknown";
      state.groups = [];
      state.isAuthenticated = false;
    },
  },
});

export const { setUserFromAuth, clearUser } = userSlice.actions;
export default userSlice.reducer;
