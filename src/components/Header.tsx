import { useSelector } from "react-redux";
import { RootState } from "../app/store";

interface HeaderProps {
  onSignOut: () => void
}

export function Header({ onSignOut }: HeaderProps) {
  const { groups, email, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );

  if (!isAuthenticated) {
    return <header>FarmVault — Not signed in</header>;
  }

  return (
    <header>
      FarmVault — Signed in as {email} 
      Groups:({groups.join(", ")})
      <button onClick={onSignOut}>Logout</button>
    </header>
  );
}