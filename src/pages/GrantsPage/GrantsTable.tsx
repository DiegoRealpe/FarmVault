import type { Schema } from "../../../amplify/data/resource";
import type {
  GrantRecordSortBy,
  GrantRecordSortDirection,
} from "../../features/grants/grantRecordSlice";
import {
  compareGrantRecords,
  formatDate,
  getGrantIdsByType,
  getSortIndicator,
} from "../../utils/utils";
import "./GrantsTable.css";

type GrantRecord = Schema["GrantRecord"]["type"];

interface GrantsTableProps {
  createdGrantRecords: GrantRecord[];
  loadingCreatedGrantRecords: boolean;
  error: string | null;
  currentUserSub: string | null;
  onRefresh: () => void;
  sortBy: GrantRecordSortBy;
  sortDirection: GrantRecordSortDirection;
  showExpired: boolean;
  onToggleSort: (sortBy: GrantRecordSortBy) => void;
  onSelectGrantRecord: (record: GrantRecord) => void;
}

function renderGrantList(ids: string[], emptyLabel: string) {
  if (ids.length === 0) {
    return (
      <span className="grants-table-empty-value">{emptyLabel}</span>
    );
  }

  return (
    <div className="grants-chip-list">
      {ids.map((id) => (
        <code key={id} className="grants-chip">
          {id}
        </code>
      ))}
    </div>
  );
}

function GrantsTable({
  createdGrantRecords,
  loadingCreatedGrantRecords,
  error,
  currentUserSub,
  onRefresh,
  sortBy,
  sortDirection,
  showExpired,
  onToggleSort,
  onSelectGrantRecord,
}: GrantsTableProps) {
  const now = Date.now();

  const filteredRecords = createdGrantRecords.filter((record) => {
    if (showExpired) {
      return true;
    }

    if (!record.expiresAt) {
      return false;
    }

    return new Date(record.expiresAt).getTime() >= now;
  });

  const records = [...filteredRecords].sort((a, b) =>
    compareGrantRecords(a, b, sortBy, sortDirection)
  );

  if (loadingCreatedGrantRecords) {
    return (
      <div className="grants-table-loading">
        <div className="grants-table-spinner"></div>
        <p>Loading grant records...</p>
      </div>
    );
  }

  if (!currentUserSub) {
    return (
      <div className="grants-table-error">
        <p className="grants-table-error-message">
          You must be logged in.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grants-table-error">
        <p className="grants-table-error-message">{error}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="grants-table-empty-state">
        <p>
          {showExpired
            ? "No grant records yet."
            : "No active grant records found."}
        </p>
        <button onClick={onRefresh} className="grants-refresh-button">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grants-table-controls">
        <div>
          <span className="grants-table-count">
            {records.length} grant record
            {records.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button onClick={onRefresh} className="grants-refresh-small">
          ↻ Refresh
        </button>
      </div>

      <div className="grants-table-wrapper">
        <table className="grants-table">
          <thead>
            <tr>
              <th
                className="grants-sortable-header"
                onClick={() => onToggleSort("userSub")}
              >
                User
                {getSortIndicator("userSub", sortBy, sortDirection)}
              </th>
              <th>Farm Grants</th>
              <th>Device Grants</th>
              <th
                className="grants-sortable-header"
                onClick={() => onToggleSort("expiresAt")}
              >
                Expires
                {getSortIndicator("expiresAt", sortBy, sortDirection)}
              </th>
              <th
                className="grants-sortable-header"
                onClick={() => onToggleSort("updatedAt")}
              >
                Updated
                {getSortIndicator("updatedAt", sortBy, sortDirection)}
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => {
              const farmIds = getGrantIdsByType(record, "farm");
              const deviceIds = getGrantIdsByType(record, "device");
              const isCurrentUser = record.userSub === currentUserSub;

              return (
                <tr
                  key={record.userSub}
                  className="grants-table-row-clickable"
                  onClick={() => onSelectGrantRecord(record)}
                >
                  <td>
                    <div className="grants-user-value">
                      {record.email ?? record.userSub}
                    </div>
                    <div className="grants-user-subtext">
                      {record.username ?? "No username"}
                      {isCurrentUser
                        ? " • Current signed-in user"
                        : ""}
                    </div>
                  </td>

                  <td>
                    {renderGrantList(farmIds, "No farm grants")}
                  </td>
                  <td>
                    {renderGrantList(deviceIds, "No device grants")}
                  </td>

                  <td>
                    <span className="grants-date-value">
                      {record.expiresAt
                        ? formatDate(record.expiresAt)
                        : "Unknown"}
                    </span>
                  </td>

                  <td>
                    <span className="grants-date-muted">
                      {record.updatedAt
                        ? formatDate(record.updatedAt)
                        : "Unknown"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default GrantsTable;
