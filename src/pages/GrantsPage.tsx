import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../app/store";
import { fetchUserGrants } from "../features/grants/userAccessSlice";
import { getCurrentUser } from "aws-amplify/auth"; // Import from aws-amplify
import "./GrantsPage.css";
import { AppDispatch } from "../app/store";

function GrantsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user);
  const { grants, loading, error } = useSelector((state: RootState) => state.userAccess);
  const [userSub, setUserSub] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Get the current authenticated user's sub from Amplify Auth
  useEffect(() => {
    async function fetchCurrentUserSub() {
      try {
        const currentUser = await getCurrentUser();
        setUserSub(currentUser.userId); // This is the Cognito sub
      } catch (error) {
        console.error("Error getting current user sub:", error);
        setUserSub(null);
      } finally {
        setAuthLoading(false);
      }
    }
    fetchCurrentUserSub();
  }, []);

  // Fetch grants when userSub is available
  useEffect(() => {
    if (userSub) {
      dispatch(fetchUserGrants(userSub));
    }
  }, [dispatch, userSub]);

  // Combined loading state
  const isLoading = authLoading || loading;

  if (isLoading) {
    return (
      <div className="grants-container">
        <header className="grants-header">
          <h1 className="grants-title">Access Grants</h1>
          <p className="grants-subtitle">Manage access permissions for other users</p>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading grants...</p>
        </div>
      </div>
    );
  }

  if (!userSub) {
    return (
      <div className="grants-container">
        <header className="grants-header">
          <h1 className="grants-title">Access Grants</h1>
          <p className="grants-subtitle">Manage access permissions for other users</p>
        </header>
        <div className="error-container">
          <p className="error-message">
            You need to be logged in to view access grants.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grants-container">
        <header className="grants-header">
          <h1 className="grants-title">Access Grants</h1>
          <p className="grants-subtitle">Manage access permissions for other users</p>
        </header>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            onClick={() => dispatch(fetchUserGrants(userSub))}
            className="refresh-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if user is admin (optional)
  const isAdmin = user.role === "admin";

  return (
    <div className="grants-container">
      <header className="grants-header">
        <h1 className="grants-title">Access Grants</h1>
        <p className="grants-subtitle">
          {isAdmin 
            ? "Manage access permissions for other users" 
            : "View your access permissions"}
        </p>
      </header>
      
      {!isAdmin && (
        <div className="info-banner">
          <p>ℹ️ You are viewing grants as a temporary user.</p>
        </div>
      )}

      <div className="grants-stats">
        <div className="stat-card">
          <span className="stat-number">{grants.length}</span>
          <span className="stat-label">Total Grants</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {grants.filter(g => new Date(g.expiresAt) > new Date()).length}
          </span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {grants.filter(g => new Date(g.expiresAt) <= new Date()).length}
          </span>
          <span className="stat-label">Expired</span>
        </div>
      </div>

      {grants.length === 0 ? (
        <div className="empty-state">
          {isAdmin ? (
            <>
              <p>No access grants found. Create your first grant!</p>
              <button className="btn btn-primary">
                + Create Grant
              </button>
            </>
          ) : (
            <p>No access grants assigned to you.</p>
          )}
        </div>
      ) : (
        <div className="grants-table-container">
          <table className="grants-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Dataset Access</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => {
                const isExpired = new Date(grant.expiresAt) <= new Date();
                return (
                  <tr key={`${grant.userSub}-${grant.createdAt}`}>
                    <td>
                      <div className="grant-user">
                        <code className="user-sub">
                          {grant.userSub === userSub ? "You" : grant.userSub}
                        </code>
                        {grant.farmId && (
                          <div className="farm-id">Farm: {grant.farmId}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="dataset-keys">
                        {grant.datasetKeys.map(key => (
                          <span key={key} className="dataset-tag">{key}</span>
                        ))}
                      </div>
                      {grant.deviceIds && grant.deviceIds.length > 0 && (
                        <div className="device-ids">
                          Devices: {grant.deviceIds.length}
                        </div>
                      )}
                    </td>
                    <td>
                      {new Date(grant.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={`expiry-date ${isExpired ? 'expired' : ''}`}>
                        {new Date(grant.expiresAt).toLocaleDateString()}
                        {isExpired && <span className="expired-badge">Expired</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isExpired ? 'status-expired' : 'status-active'}`}>
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GrantsPage;