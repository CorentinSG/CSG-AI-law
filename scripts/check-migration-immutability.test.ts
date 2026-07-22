import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import * as migrationChecker from "./check-migration-immutability.mjs";

const checker = migrationChecker as typeof migrationChecker & {
  parseGitNameStatusOutput(output: string): Array<{
    status: string;
    paths: string[];
  }>;
};
const { findMigrationViolations } = migrationChecker;
const checkerPath = path.resolve("scripts/check-migration-immutability.mjs");
const temporaryRepos: string[] = [];

function change(status: string, ...paths: string[]) {
  return { status, paths };
}

function git(repo: string, args: string[]) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
}

function writeRepoFile(repo: string, filePath: string, contents: string) {
  const absolutePath = path.join(repo, ...filePath.split("/"));
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, contents);
}

function createRepo() {
  const repo = mkdtempSync(path.join(tmpdir(), "migration-guard-"));
  temporaryRepos.push(repo);
  git(repo, ["init", "--quiet"]);
  git(repo, ["config", "user.email", "migration-guard@example.com"]);
  git(repo, ["config", "user.name", "Migration Guard Test"]);
  return repo;
}

function commitAll(repo: string, message: string) {
  git(repo, ["add", "--all"]);
  git(repo, ["commit", "--quiet", "-m", message]);
}

function runChecker(repo: string, args: string[] = []) {
  return spawnSync(process.execPath, [checkerPath, ...args], {
    cwd: repo,
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const repo of temporaryRepos.splice(0)) {
    rmSync(repo, { recursive: true, force: true });
  }
});

describe("migration immutability policy", () => {
  it("accepts a newly added versioned Supabase migration", () => {
    expect(
      findMigrationViolations([
        change("A", "supabase/migrations/20260721120000_remote_schema.sql"),
      ]),
    ).toEqual([]);
  });

  it("rejects additions to the historical migration lineage", () => {
    expect(
      findMigrationViolations([
        change("A", "src/db/migrations/032_forbidden_historical_addition.sql"),
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
    expect(findMigrationViolations([change(status, path)])).toEqual([
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
  ])("rejects migration renames", (serializedChange, message) => {
    const [status, ...paths] = serializedChange.split("\t");
    expect(findMigrationViolations([change(status, ...paths)])).toEqual([message]);
  });

  it("rejects an unversioned file in the Supabase migration lineage", () => {
    expect(
      findMigrationViolations([change("A", "supabase/migrations/manual.sql")]),
    ).toEqual([
      "A supabase/migrations/manual.sql: new Supabase migrations must be versioned SQL files",
    ]);
  });

  it("ignores changes outside migration paths", () => {
    expect(
      findMigrationViolations([
        change("M", "src/lib/env.ts"),
        change("A", "supabase/config.toml"),
      ]),
    ).toEqual([]);
  });

  it("parses NUL-delimited status, path, and rename fields without path quoting", () => {
    const output = [
      "M",
      "src/db/migrations/031_r\u00e9sum\u00e9.sql",
      "R100",
      'supabase/migrations/20260721120000_"old".sql',
      "supabase/migrations/20260721120000_new\\name.sql",
      "A",
      "src/db/migrations/032_tab\tname.sql",
      "",
    ].join("\0");

    const changes = checker.parseGitNameStatusOutput(output);

    expect(changes).toEqual([
      { status: "M", paths: ["src/db/migrations/031_r\u00e9sum\u00e9.sql"] },
      {
        status: "R100",
        paths: [
          'supabase/migrations/20260721120000_"old".sql',
          "supabase/migrations/20260721120000_new\\name.sql",
        ],
      },
      { status: "A", paths: ["src/db/migrations/032_tab\tname.sql"] },
    ]);
    expect(findMigrationViolations(changes)).toEqual([
      "M src/db/migrations/031_r\u00e9sum\u00e9.sql: committed migrations are immutable",
      'R100 supabase/migrations/20260721120000_"old".sql -> supabase/migrations/20260721120000_new\\name.sql: committed migrations are immutable',
      "A src/db/migrations/032_tab\tname.sql: src/db/migrations is immutable",
    ]);
  });

  it("collects staged, unstaged, and untracked migration paths from a real repository", () => {
    const repo = createRepo();
    writeRepoFile(repo, "src/db/migrations/030_staged.sql", "select 1;\n");
    writeRepoFile(repo, "src/db/migrations/031_unstaged.sql", "select 1;\n");
    commitAll(repo, "baseline");

    writeRepoFile(repo, "src/db/migrations/030_staged.sql", "select 2;\n");
    git(repo, ["add", "src/db/migrations/030_staged.sql"]);
    writeRepoFile(repo, "src/db/migrations/031_unstaged.sql", "select 3;\n");
    writeRepoFile(repo, "src/db/migrations/032_r\u00e9sum\u00e9_copy.sql", "select 4;\n");

    const result = runChecker(repo);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("M src/db/migrations/030_staged.sql");
    expect(result.stderr).toContain("M src/db/migrations/031_unstaged.sql");
    expect(result.stderr).toContain("A src/db/migrations/032_r\u00e9sum\u00e9_copy.sql");
  });

  it("collects committed renames and untracked files with --base", () => {
    const repo = createRepo();
    const oldPath = "src/db/migrations/031_old.sql";
    const newPath = "src/db/migrations/031_new.sql";
    writeRepoFile(repo, oldPath, "select 1;\n");
    commitAll(repo, "baseline");
    const base = git(repo, ["rev-parse", "HEAD"]);

    renameSync(
      path.join(repo, ...oldPath.split("/")),
      path.join(repo, ...newPath.split("/")),
    );
    commitAll(repo, "rename migration");
    writeRepoFile(repo, "supabase/migrations/manual.sql", "select 2;\n");

    const result = runChecker(repo, ["--base", base]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "R100 src/db/migrations/031_old.sql -> src/db/migrations/031_new.sql",
    );
    expect(result.stderr).toContain(
      "A supabase/migrations/manual.sql: new Supabase migrations must be versioned SQL files",
    );
  });
});
