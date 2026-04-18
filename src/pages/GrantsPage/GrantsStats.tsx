import type { Schema } from "../../../amplify/data/resource";
import "./GrantsStats.css";

type GrantRecord = Schema["GrantRecord"]["type"];
type GrantEntry = NonNullable<NonNullable<GrantRecord["grants"]>[number]>;

interface GrantsStatsProps {
  grantRecord: GrantRecord | null;
  isAdmin: boolean;
  loading?: boolean;
  error?: string | null;
}

function getGrantIdsByType(
  grantRecord: GrantRecord,
  grantType: "farm" | "device",
): string[] {
  return (grantRecord.grants ?? [])
    .filter((grant): grant is GrantEntry => grant != null)
    .filter((grant) => grant.grantType === grantType)
    .flatMap((grant) =>
      (grant.ids ?? []).filter((id): id is string => typeof id === "string"),
    );
}

function GrantsStats({
  grantRecord,
  isAdmin,
  loading = false,
  error = null,
}: GrantsStatsProps) {
  if (isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <section className="grants-stats-panel">
        <div className="grants-stats-header">
          <h2>Your Access Grants</h2>
        </div>
        <div className="grants-stats-empty">Loading your grant record...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="grants-stats-panel">
        <div className="grants-stats-header">
          <h2>Your Access Grants</h2>
        </div>
        <div className="grants-stats-empty">{error}</div>
      </section>
    );
  }

  if (!grantRecord) {
    return (
      <section className="grants-stats-panel">
        <div className="grants-stats-header">
          <h2>Your Access Grants</h2>
        </div>
        <div className="grants-stats-empty">
          No grant record found for your account.
        </div>
      </section>
    );
  }

  const now = Date.now();
  const expiresAtMs = new Date(grantRecord.expiresAt).getTime();
  const isActive = expiresAtMs > now;

  const farmIds = getGrantIdsByType(grantRecord, "farm");
  const deviceIds = getGrantIdsByType(grantRecord, "device");

  return (
    <section className="grants-stats-panel">
      <div className="grants-stats-header">
        <h2>Your Access Grants</h2>
        <span
          className={`grant-status-badge ${isActive ? "active" : "expired"}`}
        >
          {isActive ? "Active" : "Expired"}
        </span>
      </div>

      <div className="grants-stats-grid">
        <div className="grant-info-card">
          <span className="grant-info-label">Expires At</span>
          <span className="grant-info-value">
            {new Date(grantRecord.expiresAt).toLocaleString()}
          </span>
        </div>

        <div className="grant-info-card">
          <span className="grant-info-label">Farm Grants</span>
          <span className="grant-info-value">{farmIds.length}</span>
        </div>

        <div className="grant-info-card">
          <span className="grant-info-label">Device Grants</span>
          <span className="grant-info-value">{deviceIds.length}</span>
        </div>
      </div>

      <div className="grant-list-section">
        <h3>Farm Access</h3>
        {farmIds.length > 0 ? (
          <div className="grant-pill-list">
            {farmIds.map((id) => (
              <div key={id} className="grant-pill">
                {id}
              </div>
            ))}
          </div>
        ) : (
          <div className="grant-list-empty">No farm grants assigned.</div>
        )}
      </div>

      <div className="grant-list-section">
        <h3>Device Access</h3>
        {deviceIds.length > 0 ? (
          <div className="grant-pill-list">
            {deviceIds.map((id) => (
              <div key={id} className="grant-pill">
                {id}
              </div>
            ))}
          </div>
        ) : (
          <div className="grant-list-empty">No device grants assigned.</div>
        )}
      </div>
    </section>
  );
}

export default GrantsStats;