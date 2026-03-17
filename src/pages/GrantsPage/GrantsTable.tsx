import type { Schema } from "../../../amplify/data/resource";

type UserAccess = Schema["UserAccess"]["type"];

interface GrantsTableProps {
  grants: UserAccess[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  currentUserSub: string | null;
  onRefresh: () => void;
}

function GrantsTable({
  grants,
  loading,
  error,
  isAdmin,
  currentUserSub,
  onRefresh,
}: GrantsTableProps) {
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading grants...</p>
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

  if (grants.length === 0) {
    return (
      <div className="empty-state">
        {isAdmin ? (
          <>
            <p>No grants yet.</p>
            <button>+ Create Grant</button>
          </>
        ) : (
          <p>No access assigned.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grants-table-container">
      <table className="grants-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Expires</th>
          </tr>
        </thead>

        <tbody>
          {grants.map((grant) => (
            <tr key={`${grant.userSub}-${grant.createdAt}`}>
              <td>
                {grant.userSub === currentUserSub ? "You" : grant.userSub}
              </td>
              <td>{grant.expiresAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GrantsTable;