import type { Schema } from "../../../amplify/data/resource";

type UserAccess = Schema["UserAccess"]["type"];

interface GrantsStatsProps {
  grants: UserAccess[];
}

function GrantsStats({ grants }: GrantsStatsProps) {
  return (
    <div className="grants-stats">
      <div className="stat-card">
        <span className="stat-number">{grants.length}</span>
        <span className="stat-label">Total Grants</span>
      </div>

      <div className="stat-card">
        <span className="stat-number">--</span>
        <span className="stat-label">Active</span>
      </div>

      <div className="stat-card">
        <span className="stat-number">--</span>
        <span className="stat-label">Expired</span>
      </div>
    </div>
  );
}

export default GrantsStats;