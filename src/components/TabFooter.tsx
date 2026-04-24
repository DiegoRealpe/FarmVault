import { Link, useLocation } from "react-router-dom";

import "./TabFooter.css";

const TabFooter = () => {
  const location = useLocation();

  const tabs = [
    { id: 1, name: "Home", path: "/", icon: "/home.svg" },
    {
      id: 2,
      name: "Devices",
      path: "/devices",
      icon: "/devices.png",
    },
    {
      id: 3,
      name: "Metrics",
      path: "/metrics",
      icon: "/metrics.png",
    },
    { id: 4, name: "Grants", path: "/grants", icon: "/grants.png" },
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
              <img
                src={tab.icon}
                alt={tab.name}
                className="tab-icon"
                width={28}
                height={28}
              />
              <span className="tab-label">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
};

export default TabFooter;
