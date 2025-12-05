import { useUser } from "../features/user/useUser";

export function Header() {
  const { name, role, loggedIn, logout } = useUser();

  if (!loggedIn) {
    return <header>FarmVault — Not signed in</header>;
  }

  return (
    <header>
      FarmVault — Signed in as {name} ({role})
      <button onClick={logout}>Logout</button>
    </header>
  );
}