import { useSelector } from "react-redux";

import { RootState } from "../app/store";
import "./Header.css";

interface HeaderProps {
  onSignOut: () => void;
}

export function Header({ onSignOut }: HeaderProps) {
  const { groups, email, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );

  if (!isAuthenticated) {
    return (
      <div className="header-container">
        <header className="header-card">
          <div className="header-left">
            <span className="header-title">FarmVault</span>
          </div>

          <div className="header-right muted">Not signed in</div>
        </header>
      </div>
    );
  }

  return (
    <div className="header-container">
      <header className="header-card">
        <div className="header-left">
          <span className="header-title">FarmVault</span>
        </div>

        <div className="header-center">
          <div className="header-user">{email}</div>
          <div className="header-groups">
            {groups.length > 0 ? groups.join(" • ") : "No groups"}
          </div>
        </div>

        <div className="header-right">
          <button className="header-logout" onClick={onSignOut}>
            Log out
          </button>
        </div>
      </header>
    </div>
  );
}
