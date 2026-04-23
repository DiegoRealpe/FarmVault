import { Link, useLocation } from "react-router-dom";
import homeIcon from "../../assets/home.svg";
import devicesIcon from "../../assets/devices.svg";
import grantsIcon from "../../assets/grants.svg";
import settingsIcon from "../../assets/settings.svg";
import "./TabFooter.css";

const TabFooter = () => {
  const location = useLocation();

  const tabs = [
    { id: 1, name: "Home", path: "/", icon: homeIcon },
    { id: 2, name: "Devices", path: "/devices", icon: devicesIcon },
    { id: 3, name: "Grants", path: "/grants", icon: grantsIcon },
    { id: 4, name: "Settings", path: "/settings", icon: settingsIcon },
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
                alt=""
                className="tab-icon"
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