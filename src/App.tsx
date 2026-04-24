import { AuthUser } from "aws-amplify/auth";
import { useDispatch } from "react-redux";
import { Route, Routes } from "react-router-dom";

import { Suspense, lazy, useEffect } from "react";

import "./App.css";
import type { AppDispatch } from "./app/store";
import { getAuthenticatedUserInfo } from "./auth/authUtils";
import { Header } from "./components/Header";
import TabFooter from "./components/TabFooter";
import {
  clearUser,
  setUserFromAuth,
} from "./features/user/userSlice";

const LandingPage = lazy(
  () => import("./pages/LandingPage/LandingPage")
);
const MetricsPage = lazy(
  () => import("./pages/MetricsPage/MetricsPage")
);
const DevicePage = lazy(
  () => import("./pages/DevicePage/DevicePage")
);
const GrantsPage = lazy(
  () => import("./pages/GrantsPage/GrantsPage")
);

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

    async function loadAuthenticatedUser() {
      try {
        const payload = await getAuthenticatedUserInfo(user);
        dispatch(setUserFromAuth(payload));
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        dispatch(clearUser());
      }
    }

    void loadAuthenticatedUser();
  }, [user, dispatch]);

  return (
    <div className="app">
      <Header onSignOut={onSignOut} />
      <main>
        <Suspense
          fallback={
            <div className="page-loading">Loading page...</div>
          }
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/devices" element={<DevicePage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/grants" element={<GrantsPage />} />
          </Routes>
        </Suspense>
      </main>
      <TabFooter />
    </div>
  );
}

export default App;
