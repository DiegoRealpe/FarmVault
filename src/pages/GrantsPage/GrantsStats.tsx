import type { Schema } from "../../../amplify/data/resource";

type GrantRecord = Schema["GrantRecord"]["type"];

interface GrantsStatsProps {
  grantRecord: GrantRecord | null;
  createdGrantRecords: GrantRecord[];
  isAdmin: boolean;
}

function GrantsStats({
  grantRecord,
  createdGrantRecords,
  isAdmin,
}: GrantsStatsProps) {
  const now = Date.now();

  // ---- Admin View ----
  if (isAdmin) {
    const total = createdGrantRecords.length;

    const active = createdGrantRecords.filter(
      (record) => new Date(record.expiresAt).getTime() > now,
    ).length;

    const expired = total - active;

    return (
      <div className="grants-stats">
        <div className="stat-card">
          <span className="stat-number">{total}</span>
          <span className="stat-label">Total Grant Records</span>
        </div>

        <div className="stat-card">
          <span className="stat-number">{active}</span>
          <span className="stat-label">Active</span>
        </div>

        <div className="stat-card">
          <span className="stat-number">{expired}</span>
          <span className="stat-label">Expired</span>
        </div>
      </div>
    );
  }

  // ---- User View ----
  const hasGrant = !!grantRecord;

  const isActive =
    grantRecord &&
    new Date(grantRecord.expiresAt).getTime() > now;

  return (
    <div className="grants-stats">
      <div className="stat-card">
        <span className="stat-number">{hasGrant ? 1 : 0}</span>
        <span className="stat-label">Your Grant</span>
      </div>

      <div className="stat-card">
        <span className="stat-number">{isActive ? 1 : 0}</span>
        <span className="stat-label">Active</span>
      </div>

      <div className="stat-card">
        <span className="stat-number">
          {hasGrant && !isActive ? 1 : 0}
        </span>
        <span className="stat-label">Expired</span>
      </div>
    </div>
  );
}

export default GrantsStats;