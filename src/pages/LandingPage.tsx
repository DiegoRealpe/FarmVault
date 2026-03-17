import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

function LandingPage() {
  const reduxState = useSelector((state: RootState) => state);

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Dev Landing Page</h1>
      <p>Current Redux state</p>

      <button
        type="button"
        onClick={() =>
          navigator.clipboard.writeText(JSON.stringify(reduxState, null, 2))
        }
        style={{ marginBottom: "1rem" }}
      >
        Copy state
      </button>

      <pre
        style={{
          backgroundColor: "#111",
          color: "#f5f5f5",
          padding: "1rem",
          borderRadius: "8px",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {JSON.stringify(reduxState, null, 2)}
      </pre>
    </main>
  );
}

export default LandingPage;