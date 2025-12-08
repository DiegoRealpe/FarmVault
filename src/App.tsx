import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TabFooter from './components/TabFooter';
import LandingPage from './pages/LandingPage';
import UserPage from './pages/UserPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <TabFooter />
      </div>
    </Router>
  );
}

export default App;
