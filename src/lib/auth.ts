import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "yourfood_super_secret_jwt_key_2026_auth_production_secure_token"
);

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  orgId: string;
  orgSlug: string;
  orgName: string;
  role: "owner" | "admin" | "manager" | "kitchen" | "waiter" | "cashier" | "marketing";
  locationId?: string;
  [key: string]: unknown;
}

export const AUTH_COOKIE_NAME = "yourfood_session";

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function hasPermission(
  userRole: SessionPayload["role"],
  allowedRoles: SessionPayload["role"][]
): boolean {
  if (userRole === "owner" || userRole === "admin") return true;
  return allowedRoles.includes(userRole);
}
