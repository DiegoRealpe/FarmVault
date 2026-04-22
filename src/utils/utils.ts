import type { Schema } from "../../amplify/data/resource";
import type {
  GrantRecordSortBy,
  GrantRecordSortDirection,
} from "../features/grants/grantRecordSlice";

type GrantRecord = Schema["GrantRecord"]["type"];
type MyGrantRecord = Schema["MyGrantRecord"]["type"];
type GrantType = "farm" | "device";

export function getGrantIdsByType(
  givenGrantRecord: GrantRecord | MyGrantRecord | null,
  grantType: GrantType,
): string[] {
  if (!givenGrantRecord) {
    return [];
  }

  return (givenGrantRecord.grants ?? [])
    .filter((grant) => grant?.grantType === grantType)
    .flatMap((grant) =>
      (grant?.ids ?? []).filter((id): id is string => typeof id === "string"),
    );
}

export function getGrantRecordSortValue(
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

export function compareGrantRecords(
  a: GrantRecord,
  b: GrantRecord,
  sortBy: GrantRecordSortBy,
  sortDirection: GrantRecordSortDirection,
): number {
  const aValue = getGrantRecordSortValue(a, sortBy);
  const bValue = getGrantRecordSortValue(b, sortBy);

  let result = 0;

  if (typeof aValue === "number" && typeof bValue === "number") {
    result = aValue - bValue;
  } else {
    result = String(aValue).localeCompare(String(bValue));
  }

  return sortDirection === "asc" ? result : -result;
}

export function getSortIndicator(
  column: GrantRecordSortBy,
  sortBy: GrantRecordSortBy,
  sortDirection: GrantRecordSortDirection,
): string {
  if (column !== sortBy) {
    return "";
  }

  return sortDirection === "asc" ? " ↑" : " ↓";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toggleStringSelection(
  value: string,
  currentValues: string[],
): string[] {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }

  return [...currentValues, value];
}