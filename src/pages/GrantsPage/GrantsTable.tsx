import type { Schema } from "../../../amplify/data/resource";
import "./GrantsTable.css";
import { formatDate } from "../../utils/utils";
import type {
  GrantRecordSortBy,
  GrantRecordSortDirection,
} from "../../features/grants/grantRecordSlice";

type GrantRecord = Schema["GrantRecord"]["type"];
type GrantEntry = NonNullable<NonNullable<GrantRecord["grants"]>[number]>;

interface GrantsTableProps {
  grantRecord: GrantRecord | null;
  createdGrantRecords: GrantRecord[];
  loadingGrantRecord: boolean;
  loadingCreatedGrantRecords: boolean;
  error: string | null;
  isAdmin: boolean;
  currentUserSub: string | null;
  onRefresh: () => void;
  sortBy: GrantRecordSortBy;
  sortDirection: GrantRecordSortDirection;
  showExpired: boolean;
  onToggleSort: (sortBy: GrantRecordSortBy) => void;
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

function renderGrantList(ids: string[], emptyLabel: string) {
  if (ids.length === 0) {
    return <span className="grants-table-empty-value">{emptyLabel}</span>;
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

function getSortValue(
  record: GrantRecord,
  sortBy: GrantRecordSortBy,
): string | number {
  switch (sortBy) {
    case "ttl":
      return record.ttl ?? 0;
    case "userSub":
      return record.userSub ?? "";
    case "createdBySub":
      return record.createdBySub ?? "";
    case "expiresAt":
      return record.expiresAt ?? "";
    case "createdAt":
      return record.createdAt ?? "";
    case "updatedAt":
      return record.updatedAt ?? "";
    default:
      return "";
  }
}

function compareRecords(
  a: GrantRecord,
  b: GrantRecord,
  sortBy: GrantRecordSortBy,
  sortDirection: GrantRecordSortDirection,
): number {
  const aValue = getSortValue(a, sortBy);
  const bValue = getSortValue(b, sortBy);

  let result = 0;

  if (typeof aValue === "number" && typeof bValue === "number") {
    result = aValue - bValue;
  } else {
    result = String(aValue).localeCompare(String(bValue));
  }

  return sortDirection === "asc" ? result : -result;
}

function getSortIndicator(
  column: GrantRecordSortBy,
  sortBy: GrantRecordSortBy,
  sortDirection: GrantRecordSortDirection,
): string {
  if (column !== sortBy) {
    return "";
  }

  return sortDirection === "asc" ? " ↑" : " ↓";
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
  sortBy,
  sortDirection,
  showExpired,
  onToggleSort,
}: GrantsTableProps) {
  const loading = isAdmin
    ? loadingGrantRecord || loadingCreatedGrantRecords
    : loadingGrantRecord;

  const baseRecords = isAdmin
    ? createdGrantRecords
    : grantRecord
      ? [grantRecord]
      : [];

  const now = Date.now();

  const filteredRecords = baseRecords.filter((record) => {
    if (showExpired) {
      return true;
    }

    return new Date(record.expiresAt).getTime() >= now;
  });

  const records = [...filteredRecords].sort((a, b) =>
    compareRecords(a, b, sortBy, sortDirection),
  );

  if (loading) {
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
        <p className="grants-table-error-message">You must be logged in.</p>
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
          {isAdmin
            ? showExpired
              ? "No grant records yet."
              : "No active grant records found."
            : showExpired
              ? "No access assigned."
              : "No active access assigned."}
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
            {records.length} grant record{records.length !== 1 ? "s" : ""}
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
                User{getSortIndicator("userSub", sortBy, sortDirection)}
              </th>
              <th>Farm Grants</th>
              <th>Device Grants</th>
              <th
                className="grants-sortable-header"
                onClick={() => onToggleSort("expiresAt")}
              >
                Expires{getSortIndicator("expiresAt", sortBy, sortDirection)}
              </th>
              <th
                className="grants-sortable-header"
                onClick={() => onToggleSort("updatedAt")}
              >
                Updated{getSortIndicator("updatedAt", sortBy, sortDirection)}
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => {
              const farmIds = getGrantIdsByType(record, "farm");
              const deviceIds = getGrantIdsByType(record, "device");
              const isCurrentUser = record.userSub === currentUserSub;

              return (
                <tr key={record.userSub}>
                  <td>
                    <div className="grants-user-value">
                      {isCurrentUser ? "You" : record.userSub}
                    </div>
                    {isAdmin && isCurrentUser && (
                      <div className="grants-user-subtext">
                        Current signed-in user
                      </div>
                    )}
                  </td>

                  <td>{renderGrantList(farmIds, "No farm grants")}</td>
                  <td>{renderGrantList(deviceIds, "No device grants")}</td>

                  <td>
                    <span className="grants-date-value">
                      {formatDate(record.expiresAt)}
                    </span>
                  </td>

                  <td>
                    <span className="grants-date-muted">
                      {formatDate(record.updatedAt)}
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