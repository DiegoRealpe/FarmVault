import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TabFooter from './components/TabFooter';
import LandingPage from './pages/LandingPage';
import DevicePage from './pages/DevicePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/devices" element={<DevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <TabFooter />
      </div>
    </Router>
  );
}

export default App;
