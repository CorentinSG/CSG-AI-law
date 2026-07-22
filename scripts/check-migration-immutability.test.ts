import { describe, expect, it } from "vitest";

import { findMigrationViolations } from "./check-migration-immutability.mjs";

describe("migration immutability policy", () => {
  it("accepts a newly added versioned Supabase migration", () => {
    expect(
      findMigrationViolations([
        "A\tsupabase/migrations/20260721120000_remote_schema.sql",
      ]),
    ).toEqual([]);
  });

  it("rejects additions to the historical migration lineage", () => {
    expect(
      findMigrationViolations([
        "A\tsrc/db/migrations/032_forbidden_historical_addition.sql",
      ]),
    ).toEqual([
      "A src/db/migrations/032_forbidden_historical_addition.sql: src/db/migrations is immutable",
    ]);
  });

  it.each([
    ["M", "supabase/migrations/20260721120000_remote_schema.sql"],
    ["D", "supabase/migrations/20260721120000_remote_schema.sql"],
    ["M", "src/db/migrations/031_repair_check_constraint_drift.sql"],
    ["D", "src/db/migrations/031_repair_check_constraint_drift.sql"],
  ])("rejects %s changes in either migration lineage", (status, path) => {
    expect(findMigrationViolations([`${status}\t${path}`])).toEqual([
      `${status} ${path}: committed migrations are immutable`,
    ]);
  });

  it.each([
    [
      "R100\tsupabase/migrations/20260721120000_old.sql\tsupabase/migrations/20260721120000_new.sql",
      "R100 supabase/migrations/20260721120000_old.sql -> supabase/migrations/20260721120000_new.sql: committed migrations are immutable",
    ],
    [
      "R100\tsrc/db/migrations/031_old.sql\tsrc/db/migrations/031_new.sql",
      "R100 src/db/migrations/031_old.sql -> src/db/migrations/031_new.sql: committed migrations are immutable",
    ],
  ])("rejects migration renames", (change, message) => {
    expect(findMigrationViolations([change])).toEqual([message]);
  });

  it("rejects an unversioned file in the Supabase migration lineage", () => {
    expect(
      findMigrationViolations(["A\tsupabase/migrations/manual.sql"]),
    ).toEqual([
      "A supabase/migrations/manual.sql: new Supabase migrations must be versioned SQL files",
    ]);
  });

  it("ignores changes outside migration paths", () => {
    expect(
      findMigrationViolations([
        "M\tsrc/lib/env.ts",
        "A\tsupabase/config.toml",
      ]),
    ).toEqual([]);
  });
});
