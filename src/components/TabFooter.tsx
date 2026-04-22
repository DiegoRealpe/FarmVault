import { Link, useLocation } from "react-router-dom";
import "./TabFooter.css";

const TabFooter = () => {
  const location = useLocation();

  const tabs = [
    { id: 1, name: "Home", path: "/", icon: "◻" },
    { id: 2, name: "Devices", path: "/devices", icon: "⌁" },
    { id: 3, name: "Grants", path: "/grants", icon: "◇" },
    { id: 4, name: "Settings", path: "/settings", icon: "○" },
  ];

  return (
    <footer className="tab-footer">
      <nav className="tab-nav" aria-label="Primary navigation">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`tab-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="tab-label">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
};

export default TabFooter;