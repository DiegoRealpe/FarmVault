import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AuthUser } from "aws-amplify/auth";

import "./App.css";

import { AppDispatch } from "./app/store";
import { getAuthenticatedUserInfo  } from "./auth/authUtils";
import { Header } from "./components/Header";
import TabFooter from "./components/TabFooter";

import LandingPage from "./pages/LandingPage";
import DevicePage from "./pages/DevicePage";
import SettingsPage from "./pages/SettingsPage";
import GrantsPage from "./pages/GrantsPage";

import {
  setUserFromAuth,
  clearUser,
} from "./features/user/userSlice";

interface AppProps {
  user: AuthUser | undefined;
  onSignOut: () => void;
}

function App({ user, onSignOut }: AppProps) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!user) {
      dispatch(clearUser());
      return;
    }

    const loadUser = async () => {
      try {
        const payload = await getAuthenticatedUserInfo(user);
        dispatch(setUserFromAuth(payload));
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        dispatch(clearUser());
      }
    };

    void loadUser();
  }, [user, dispatch]);

  return (
    <div className="app">
      <Header onSignOut={onSignOut} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/grants" element={<GrantsPage />} />
          <Route path="/devices" element={<DevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      <TabFooter />
    </div>
  );
}

export default App;