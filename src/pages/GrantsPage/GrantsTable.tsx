import type { Schema } from "../../../amplify/data/resource";

type GrantRecord = Schema["GrantRecord"]["type"];

interface GrantsTableProps {
  grantRecord: GrantRecord | null;
  createdGrantRecords: GrantRecord[];
  loadingGrantRecord: boolean;
  loadingCreatedGrantRecords: boolean;
  error: string | null;
  isAdmin: boolean;
  currentUserSub: string | null;
  onRefresh: () => void;
}

function formatGrantSummary(grantRecord: GrantRecord): string {
  return (grantRecord.grants ?? [])
    .filter((grant): grant is NonNullable<typeof grant> => grant != null)
    .map((grant) => {
      const ids = grant.ids ?? [];
      return `${grant.grantType}: ${ids.join(", ")}`;
    })
    .join(" | ");
}

function GrantsTable({
  grantRecord,
  createdGrantRecords,
  loadingGrantRecord,
  loadingCreatedGrantRecords,
  error,
  isAdmin,
  currentUserSub,
  onRefresh,
}: GrantsTableProps) {
  const loading = isAdmin
    ? loadingGrantRecord || loadingCreatedGrantRecords
    : loadingGrantRecord;

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading grant records...</p>
      </div>
    );
  }

  if (!currentUserSub) {
    return (
      <div className="error-container">
        <p>You must be logged in.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={onRefresh}>Retry</button>
      </div>
    );
  }

  if (isAdmin) {
    if (createdGrantRecords.length === 0) {
      return (
        <div className="empty-state">
          <p>No grant records yet.</p>
          <button>+ Create Grant</button>
        </div>
      );
    }

    return (
      <div className="grants-table-container">
        <table className="grants-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Grants</th>
              <th>Expires</th>
            </tr>
          </thead>

          <tbody>
            {createdGrantRecords.map((record) => (
              <tr key={record.userSub}>
                <td>{record.userSub === currentUserSub ? "You" : record.userSub}</td>
                <td>{formatGrantSummary(record)}</td>
                <td>{record.expiresAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!grantRecord) {
    return (
      <div className="empty-state">
        <p>No access assigned.</p>
      </div>
    );
  }

  return (
    <div className="grants-table-container">
      <table className="grants-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Grants</th>
            <th>Expires</th>
          </tr>
        </thead>

        <tbody>
          <tr key={grantRecord.userSub}>
            <td>You</td>
            <td>{formatGrantSummary(grantRecord)}</td>
            <td>{grantRecord.expiresAt}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default GrantsTable;