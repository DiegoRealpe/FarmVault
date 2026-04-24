import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface UserState {
  sub: string | null;
  email: string | null;
  groups: string[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const initialState: UserState = {
  sub: null,
  email: null,
  groups: [],
  isAuthenticated: false,
  isAdmin: false,
};

interface SetUserPayload {
  sub: string;
  email: string | null;
  groups: string[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserFromAuth(state, action: PayloadAction<SetUserPayload>) {
      const { sub, email, groups, isAuthenticated, isAdmin } =
        action.payload;

      state.sub = sub;
      state.email = email;
      state.groups = Array.isArray(groups) ? groups : [];
      state.isAuthenticated = isAuthenticated;
      state.isAdmin = isAdmin;
    },

    clearUser(state) {
      state.sub = null;
      state.email = null;
      state.groups = [];
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
  },
});

export const { setUserFromAuth, clearUser } = userSlice.actions;
export default userSlice.reducer;
