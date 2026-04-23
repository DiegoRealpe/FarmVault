import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import landingImage from "../../assets/landingimage.webp";
import "./LandingPage.css";

type LandingViewMode = "showcase" | "state";

function LandingPage() {
  const reduxState = useSelector((state: RootState) => state);
  const [viewMode, setViewMode] = useState<LandingViewMode>("showcase");

  async function handleCopyState() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(reduxState, null, 2));
    } catch (error) {
      console.error("Failed to copy redux state:", error);
    }
  }

  return (
    <main className="landing-page">
      <section className="landing-page__shell">
        <header className="landing-page__header">
          <div className="landing-page__heading">
            <h1 className="landing-page__title">FarmVault</h1>
            <p className="landing-page__subtitle">
              Secure farm data access, visibility, and device intelligence in one place.
            </p>
          </div>

          <div
            className="landing-page__toggle"
            role="tablist"
            aria-label="Landing page view mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "showcase"}
              className={`landing-page__toggle-button ${
                viewMode === "showcase"
                  ? "landing-page__toggle-button--active"
                  : ""
              }`}
              onClick={() => setViewMode("showcase")}
            >
              Showcase
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "state"}
              className={`landing-page__toggle-button ${
                viewMode === "state"
                  ? "landing-page__toggle-button--active"
                  : ""
              }`}
              onClick={() => setViewMode("state")}
            >
              Redux State
            </button>
          </div>
        </header>

        {viewMode === "showcase" ? (
          <section className="landing-page__showcase">
            <div className="landing-page__showcase-card">
              <img
                src={landingImage}
                alt="FarmVault marketing graphic"
                className="landing-page__hero-image"
              />
            </div>
          </section>
        ) : (
          <section className="landing-page__state-panel">
            <div className="landing-page__state-actions">
              <h2 className="landing-page__panel-title">Current Redux State</h2>

              <button
                type="button"
                className="landing-page__copy-button"
                onClick={handleCopyState}
              >
                Copy State
              </button>
            </div>

            <pre className="landing-page__state-block">
              {JSON.stringify(reduxState, null, 2)}
            </pre>
          </section>
        )}
      </section>
    </main>
  );
}

export default LandingPage;