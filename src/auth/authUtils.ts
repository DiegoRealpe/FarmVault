import { AuthUser, fetchAuthSession } from "aws-amplify/auth";

export interface AuthenticatedUserInfo {
  sub: string;
  email: string | null;
  groups: string[];
}

export async function getAuthenticatedUserInfo(
  user: AuthUser
): Promise<AuthenticatedUserInfo> {
  const session = await fetchAuthSession();
  const payload = session.tokens?.idToken?.payload;

  const sub = payload?.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Authenticated user is missing Cognito sub");
  }

  const email =
    typeof payload?.email === "string"
      ? payload.email
      : user.signInDetails?.loginId ?? user.username ?? null;

  const groupsClaim = payload?.["cognito:groups"];
  const groups = Array.isArray(groupsClaim)
    ? groupsClaim.filter((g): g is string => typeof g === "string")
    : [];

  return {
    sub,
    email,
    groups,
  };
}