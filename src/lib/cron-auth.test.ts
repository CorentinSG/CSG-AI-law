import { afterEach, describe, expect, it } from "vitest";

import { getCronAuthStatus } from "@/lib/cron-auth";
import { resetEnvForTests } from "@/lib/env";

describe("cron auth", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_AUTH_SECRET;
    resetEnvForTests();
  });

  it("rejects when CRON_SECRET is not configured", () => {
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    resetEnvForTests();
    const request = new Request("http://localhost/api/cron");

    expect(getCronAuthStatus(request)).toEqual({
      ok: false,
      reason: "missing_cron_secret",
    });
  });

  it("rejects missing authorization header", () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    resetEnvForTests();

    const request = new Request("http://localhost/api/cron");

    expect(getCronAuthStatus(request)).toEqual({
      ok: false,
      reason: "missing_authorization_header",
    });
  });

  it("accepts the configured bearer token", () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    resetEnvForTests();

    const request = new Request("http://localhost/api/cron", {
      headers: {
        authorization: "Bearer 1234567890abcdef",
      },
    });

    expect(getCronAuthStatus(request)).toEqual({
      ok: true,
      reason: "authorized",
    });
  });

  it("rejects a wrong bearer token even when it has the expected length", () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    resetEnvForTests();

    const request = new Request("http://localhost/api/cron", {
      headers: {
        authorization: "Bearer 1234567890abcdee",
      },
    });

    expect(getCronAuthStatus(request)).toEqual({
      ok: false,
      reason: "invalid_cron_secret",
    });
  });
});
