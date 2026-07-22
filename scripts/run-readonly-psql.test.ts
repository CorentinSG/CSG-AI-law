import { describe, expect, it, vi } from "vitest";

import type { PsqlSpawn } from "./run-readonly-psql";

const DATABASE_URL =
  "postgresql://csg_schema_auditor.abcdefghijklmnopqrst:p%40ss%3Aword@aws-0-us-east-1.pooler.supabase.com:5432/audit_db?sslmode=require&options=-c%20default_transaction_read_only%3Don";

describe("read-only psql wrapper", () => {
  it("passes only validated libpq settings and psql flags to the child", async () => {
    const { runReadonlyPsql } = await import("./run-readonly-psql");
    const invocations: Parameters<PsqlSpawn>[] = [];
    const spawnPsql = vi.fn<PsqlSpawn>((...args) => {
      invocations.push(args);
      return { status: 0 };
    });
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      PATH: "test-path",
      PRE_016_BACKUP_DATABASE_URL: DATABASE_URL,
      DATABASE_URL,
    };

    expect(
      runReadonlyPsql(
        ["PRE_016_BACKUP_DATABASE_URL", "-X", "-q", "-f", "audit.sql"],
        env,
        spawnPsql,
      ),
    ).toBe(0);

    expect(spawnPsql).toHaveBeenCalledOnce();
    const [command, args, options] = invocations[0];
    expect(command).toBe("psql");
    expect(args).toEqual(["-X", "-q", "-f", "audit.sql"]);
    expect([command, ...args]).not.toContain(DATABASE_URL);
    expect(options).toMatchObject({
      stdio: "inherit",
      env: {
        PATH: "test-path",
        PGHOST: "aws-0-us-east-1.pooler.supabase.com",
        PGPORT: "5432",
        PGUSER: "csg_schema_auditor.abcdefghijklmnopqrst",
        PGPASSWORD: "p@ss:word",
        PGDATABASE: "audit_db",
        PGSSLMODE: "require",
        PGOPTIONS: "-c default_transaction_read_only=on",
      },
    });
    expect(options.env).not.toHaveProperty("DATABASE_URL");
    expect(options.env).not.toHaveProperty("PRE_016_BACKUP_DATABASE_URL");
  });

  it("rejects an invalid route before spawning psql", async () => {
    const { runReadonlyPsql } = await import("./run-readonly-psql");
    const spawnPsql = vi.fn<PsqlSpawn>(() => ({ status: 0 }));
    const transactionPoolerUrl = DATABASE_URL.replace(":5432/", ":6543/");

    expect(() =>
      runReadonlyPsql(
        ["AUDIT_DATABASE_URL", "-f", "audit.sql"],
        { NODE_ENV: "test", AUDIT_DATABASE_URL: transactionPoolerUrl },
        spawnPsql,
      ),
    ).toThrow("DATABASE_URL must use the read-only Supabase session pooler");
    expect(spawnPsql).not.toHaveBeenCalled();
  });

  it("does not include the credential value in missing-process errors", async () => {
    const { runReadonlyPsql } = await import("./run-readonly-psql");
    const spawnPsql = vi.fn<PsqlSpawn>(() => ({
      status: null,
      error: new Error("spawn psql ENOENT"),
    }));

    expect(() =>
      runReadonlyPsql(
        ["AUDIT_DATABASE_URL", "-f", "audit.sql"],
        { NODE_ENV: "test", AUDIT_DATABASE_URL: DATABASE_URL },
        spawnPsql,
      ),
    ).toThrow("Unable to start psql");

    try {
      runReadonlyPsql(
        ["AUDIT_DATABASE_URL", "-f", "audit.sql"],
        { NODE_ENV: "test", AUDIT_DATABASE_URL: DATABASE_URL },
        spawnPsql,
      );
    } catch (error) {
      expect(String(error)).not.toContain(DATABASE_URL);
    }
  });
});
