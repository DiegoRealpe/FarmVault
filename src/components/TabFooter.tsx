import { Link, useLocation } from 'react-router-dom';
import './TabFooter.css';

const TabFooter = () => {
  const location = useLocation();
  
  const tabs = [
    { id: 1, name: 'Todos', path: '/', icon: '📝' },
    { id: 2, name: 'Devices', path: '/devices', icon: '👤' },
    { id: 3, name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <footer className="tab-footer">
      <nav className="tab-nav">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={`tab-item ${location.pathname === tab.path ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.name}</span>
          </Link>
        ))}
      </nav>
    </footer>
  );
};

export default TabFooter;