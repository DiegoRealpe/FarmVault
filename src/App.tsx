import { Routes, Route } from 'react-router-dom';
import TabFooter from './components/TabFooter';
import LandingPage from './pages/LandingPage';
import DevicePage from './pages/DevicePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';
import GrantsPage from './pages/GrantsPage';
import { setUserFromAuth, clearUser } from "./features/user/userSlice";
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './app/store';
import { Header } from './components/Header';
import { AuthUser, fetchAuthSession } from 'aws-amplify/auth';

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

    const email =
      user.signInDetails?.loginId ??
      user.username ??
      "";

    (async () => {
      try {
        const session = await fetchAuthSession();
        const groups =
          (session.tokens?.accessToken?.payload?.[
            "cognito:groups"
          ] as string[] | undefined) ?? [];

        dispatch(
          setUserFromAuth({
            email,
            groups,
          })
        );
      } catch {
        dispatch(
          setUserFromAuth({
            email,
            groups: [],
          })
        );
      }
    })();
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
