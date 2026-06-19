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
});
