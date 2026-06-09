import { beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  process.env.ADMIN_AUTH_SECRET = "test-admin-auth-secret-1234567890";
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "change-me";
  process.env.APP_DATA_MODE = "memory";
});

describe("admin auth helpers", () => {
  it("parses and validates basic auth credentials", async () => {
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();
    const { parseBasicAuthHeader, isValidAdminCredentials } = await import(
      "@/lib/admin-auth"
    );

    const header = `Basic ${Buffer.from("admin:change-me").toString("base64")}`;
    const parsed = parseBasicAuthHeader(header);

    expect(parsed?.username).toBe("admin");
    expect(parsed?.password).toBe("change-me");
    expect(isValidAdminCredentials("admin", "change-me")).toBe(true);
    expect(isValidAdminCredentials("admin", "wrong")).toBe(false);
  });

  it("creates a stable signed admin session token", async () => {
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();
    const { createAdminSessionToken, isValidAdminSessionToken } = await import(
      "@/lib/admin-auth"
    );

    const token = createAdminSessionToken();
    expect(isValidAdminSessionToken(token)).toBe(true);
    expect(isValidAdminSessionToken("bad-token")).toBe(false);
  });
});
