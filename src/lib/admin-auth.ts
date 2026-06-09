import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

const ADMIN_SESSION_COOKIE = "csg_admin_session";

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function parseBasicAuthHeader(header: string | null) {
  if (!header?.startsWith("Basic ")) return null;

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const [username, ...rest] = decoded.split(":");
  const password = rest.join(":");
  if (!username || !password) return null;

  return { username, password };
}

// Compare admin credentials in constant time to prevent timing attacks.
// Both username and password use timingSafeEqual so an attacker cannot infer
// which field is wrong or how many characters match.
// Buffers are zero-padded to a fixed length so buffer-length differences do
// not short-circuit the comparison.
export function isValidAdminCredentials(
  username: string,
  password: string,
): boolean {
  const FIXED_LENGTH = 256;

  function toFixedBuffer(value: string) {
    const buf = Buffer.alloc(FIXED_LENGTH, 0);
    Buffer.from(value, "utf8").copy(buf, 0, 0, FIXED_LENGTH);
    return buf;
  }

  // Evaluate both independently — no short-circuit leakage.
  const usernameMatch = timingSafeEqual(
    toFixedBuffer(username),
    toFixedBuffer(env.ADMIN_USERNAME),
  );
  const passwordMatch = timingSafeEqual(
    toFixedBuffer(password),
    toFixedBuffer(env.ADMIN_PASSWORD),
  );

  return usernameMatch && passwordMatch;
}

export function createAdminSessionToken() {
  const payload = `${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD}`;
  return createHmac("sha256", env.ADMIN_AUTH_SECRET).update(payload).digest("hex");
}

export function isValidAdminSessionToken(token: string | undefined) {
  if (!token) return false;

  const expected = createAdminSessionToken();
  const left = toBuffer(token);
  const right = toBuffer(expected);
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export function attachAdminSession(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function requestHasAdminSession(request: NextRequest) {
  return isValidAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export function requestHasValidAdminAuth(request: NextRequest | Request) {
  const parsed = parseBasicAuthHeader(request.headers.get("authorization"));
  if (!parsed) return false;
  return isValidAdminCredentials(parsed.username, parsed.password);
}

export async function assertAdminServerActionAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSessionToken(token)) {
    throw new Error("Unauthorized admin action.");
  }
}

export function hasAdminSessionCookieForRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;

  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.split("=")[1];

  return isValidAdminSessionToken(token);
}
