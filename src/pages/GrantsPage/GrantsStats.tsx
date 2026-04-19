import "./GrantsStats.css";

type GrantType = "farm" | "device";

type GrantEntry = {
  grantType: GrantType;
  ids: (string | null | undefined)[];
};

type MyGrantRecord = {
  grants: (GrantEntry | null | undefined)[];
  expiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  username?: string | null;
  email?: string | null;
};

interface GrantsStatsProps {
  grantRecord: MyGrantRecord | null;
  isAdmin: boolean;
  loading?: boolean;
  error?: string | null;
}

function getGrantIdsByType(
  grantRecord: MyGrantRecord,
  grantType: GrantType,
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

  const expiresAtMs = grantRecord.expiresAt
    ? new Date(grantRecord.expiresAt).getTime()
    : 0;
  const isActive = expiresAtMs > Date.now();

  const farmIds = getGrantIdsByType(grantRecord, "farm");
  const deviceIds = getGrantIdsByType(grantRecord, "device");

  const displayEmail = grantRecord.email ?? "Email unavailable";
  const displayUsername = grantRecord.username ?? "Username unavailable";
  const displayExpiresAt = grantRecord.expiresAt
    ? new Date(grantRecord.expiresAt).toLocaleString()
    : "Unknown";

  return (
    <section className="grants-stats-panel">
      <div className="grants-stats-header">
        <div>
          <h2>Your Access Grants</h2>
          <div className="grant-user-summary">
            <span>{displayEmail}</span>
            <span className="grant-user-summary-separator">•</span>
            <span>{displayUsername}</span>
          </div>
        </div>

        <span
          className={`grant-status-badge ${isActive ? "active" : "expired"}`}
        >
          {isActive ? "Active" : "Expired"}
        </span>
      </div>

      <div className="grants-stats-grid">
        <div className="grant-info-card">
          <span className="grant-info-label">Expires At</span>
          <span className="grant-info-value">{displayExpiresAt}</span>
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