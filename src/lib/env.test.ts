import { afterEach, beforeEach, describe, expect, it } from "vitest";

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: typeof process.env.NODE_ENV) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function clearEnv() {
  delete process.env.APP_DATA_MODE;
  delete process.env.ALLOW_MEMORY_MODE_IN_PRODUCTION;
  delete process.env.ADMIN_AUTH_SECRET;
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.VERCEL_ENV;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

describe("env validation", () => {
  beforeEach(async () => {
    clearEnv();
    setNodeEnv(originalNodeEnv);
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();
  });

  afterEach(async () => {
    clearEnv();
    setNodeEnv(originalNodeEnv);
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();
  });

  it("keeps default admin credentials available outside production", async () => {
    setNodeEnv("test");
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "memory";
    const { getEnv, resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    expect(getEnv()).toMatchObject({
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "change-me",
    });
  });

  it("rejects default admin credentials in production", async () => {
    setNodeEnv("production");
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "memory";
    process.env.ALLOW_MEMORY_MODE_IN_PRODUCTION = "true";
    const { EnvValidationError, getEnv, resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    expect(() => getEnv()).toThrow(EnvValidationError);
    expect(() => getEnv()).toThrow("Production admin credentials must not use");
  });

  it("allows default admin credentials during Vercel preview builds", async () => {
    setNodeEnv("production");
    process.env.VERCEL_ENV = "preview";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "memory";
    process.env.ALLOW_MEMORY_MODE_IN_PRODUCTION = "true";
    const { getEnv, resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    expect(getEnv()).toMatchObject({
      VERCEL_ENV: "preview",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "change-me",
    });
  });

  it("rejects default admin credentials on Vercel production deployments", async () => {
    setNodeEnv("production");
    process.env.VERCEL_ENV = "production";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "memory";
    process.env.ALLOW_MEMORY_MODE_IN_PRODUCTION = "true";
    const { EnvValidationError, getEnv, resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    expect(() => getEnv()).toThrow(EnvValidationError);
    expect(() => getEnv()).toThrow("Production admin credentials must not use");
  });

  it("accepts non-default admin credentials in production", async () => {
    setNodeEnv("production");
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.ADMIN_USERNAME = "operator";
    process.env.ADMIN_PASSWORD = "a-strong-admin-password";
    process.env.APP_DATA_MODE = "memory";
    process.env.ALLOW_MEMORY_MODE_IN_PRODUCTION = "true";
    const { getEnv, resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    expect(getEnv()).toMatchObject({
      ADMIN_USERNAME: "operator",
      ADMIN_PASSWORD: "a-strong-admin-password",
      APP_DATA_MODE: "memory",
    });
  });

  it("rejects a database URL that is not the read-only Supabase session pooler", async () => {
    const { parseDatabaseUrl } = await import("@/lib/env");

    expect(() =>
      parseDatabaseUrl(
        "postgresql://postgres:pw@db.example.com:5432/postgres",
      ),
    ).toThrow("DATABASE_URL must use the read-only Supabase session pooler");
  });

  it("accepts the dedicated read-only Supabase session pooler URL", async () => {
    const { parseDatabaseUrl } = await import("@/lib/env");
    const databaseUrl =
      "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=-c%20default_transaction_read_only%3Don";

    expect(parseDatabaseUrl(databaseUrl)).toBe(databaseUrl);
  });

  it.each([
    "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&sslmode=disable&options=-c%20default_transaction_read_only%3Don",
    "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=disable&sslmode=require&options=-c%20default_transaction_read_only%3Don",
  ])("rejects duplicate sslmode parameters", async (databaseUrl) => {
    const { parseDatabaseUrl } = await import("@/lib/env");

    expect(() => parseDatabaseUrl(databaseUrl)).toThrow(
      "DATABASE_URL must use the read-only Supabase session pooler",
    );
  });

  it("rejects duplicate options parameters even when both request read-only mode", async () => {
    const { parseDatabaseUrl } = await import("@/lib/env");
    const databaseUrl =
      "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=-c%20default_transaction_read_only%3Don&options=-c%20default_transaction_read_only%3Don";

    expect(() => parseDatabaseUrl(databaseUrl)).toThrow(
      "DATABASE_URL must use the read-only Supabase session pooler",
    );
  });

  it.each([
    "-c default_transaction_read_only=on -c default_transaction_read_only=off",
    "-c default_transaction_read_only=off -c default_transaction_read_only=on",
    "-cdefault_transaction_read_only=on -cdefault_transaction_read_only=off",
    "--default_transaction_read_only=on --default_transaction_read_only=off",
  ])("rejects conflicting read-only option assignments: %s", async (options) => {
    const { parseDatabaseUrl } = await import("@/lib/env");
    const databaseUrl =
      "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=" +
      encodeURIComponent(options);

    expect(() => parseDatabaseUrl(databaseUrl)).toThrow(
      "DATABASE_URL must use the read-only Supabase session pooler",
    );
  });

  it.each([
    "-c not_default_transaction_read_only=on",
    "-c default_transaction_read_only=only",
    "-c default_transaction_read_only=onward",
  ])("rejects inexact read-only option assignments: %s", async (options) => {
    const { parseDatabaseUrl } = await import("@/lib/env");
    const databaseUrl =
      "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=" +
      encodeURIComponent(options);

    expect(() => parseDatabaseUrl(databaseUrl)).toThrow(
      "DATABASE_URL must use the read-only Supabase session pooler",
    );
  });

  it.each([
    "-cdefault_transaction_read_only=on",
    "--default_transaction_read_only=on",
  ])("accepts one exact PostgreSQL read-only assignment: %s", async (options) => {
    const { parseDatabaseUrl } = await import("@/lib/env");
    const databaseUrl =
      "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=" +
      encodeURIComponent(options);

    expect(parseDatabaseUrl(databaseUrl)).toBe(databaseUrl);
  });

  it.each([
    "postgresql://postgres:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=-c%20default_transaction_read_only%3Don",
    "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?options=-c%20default_transaction_read_only%3Don",
    "postgresql://csg_schema_auditor:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
  ])("rejects a database URL missing a read-only audit safeguard", async (databaseUrl) => {
    const { parseDatabaseUrl } = await import("@/lib/env");

    expect(() => parseDatabaseUrl(databaseUrl)).toThrow(
      "DATABASE_URL must use the read-only Supabase session pooler",
    );
  });

  it("keeps DATABASE_URL optional", async () => {
    const { parseDatabaseUrl } = await import("@/lib/env");

    expect(parseDatabaseUrl(undefined)).toBeUndefined();
  });
});
