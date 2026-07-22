import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HISTORICAL_MIGRATION_PREFIX = "src/db/migrations/";
const SUPABASE_MIGRATION_PREFIX = "supabase/migrations/";
const VERSIONED_MIGRATION = /^supabase\/migrations\/\d{14}_[^/]+\.sql$/;

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function isMigrationPath(filePath) {
  return (
    filePath.startsWith(HISTORICAL_MIGRATION_PREFIX) ||
    filePath.startsWith(SUPABASE_MIGRATION_PREFIX)
  );
}

export function findMigrationViolations(changes) {
  const violations = [];

  for (const change of changes) {
    if (!change.trim()) continue;

    const [status, ...rawPaths] = change.split("\t");
    const paths = rawPaths.map(normalizePath);
    const migrationPaths = paths.filter(isMigrationPath);
    if (migrationPaths.length === 0) continue;

    const displayPath = paths.join(" -> ");
    if (
      status === "A" &&
      paths.length === 1 &&
      paths[0].startsWith(HISTORICAL_MIGRATION_PREFIX)
    ) {
      violations.push(
        `${status} ${displayPath}: src/db/migrations is immutable`,
      );
      continue;
    }

    if (
      status === "A" &&
      paths.length === 1 &&
      paths[0].startsWith(SUPABASE_MIGRATION_PREFIX)
    ) {
      if (!VERSIONED_MIGRATION.test(paths[0])) {
        violations.push(
          `${status} ${displayPath}: new Supabase migrations must be versioned SQL files`,
        );
      }
      continue;
    }

    violations.push(
      `${status} ${displayPath}: committed migrations are immutable`,
    );
  }

  return violations;
}

function runGit(args) {
  const output = execFileSync("git", args, { encoding: "utf8" }).trim();
  return output ? output.split(/\r?\n/) : [];
}

function collectChanges(base) {
  const trackedChanges = base
    ? runGit(["diff", "--name-status", "--find-renames", `${base}...HEAD`])
    : [
        ...runGit([
          "diff",
          "--cached",
          "--name-status",
          "--find-renames",
          "HEAD",
        ]),
        ...runGit(["diff", "--name-status", "--find-renames"]),
      ];
  const untrackedChanges = runGit([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]).map((filePath) => `A\t${filePath}`);

  return [...new Set([...trackedChanges, ...untrackedChanges])];
}

function parseBaseArgument(args) {
  if (args.length === 0) return undefined;
  if (args.length === 2 && args[0] === "--base" && args[1].trim()) {
    return args[1];
  }
  throw new Error("Usage: node scripts/check-migration-immutability.mjs [--base <merge-base>]");
}

function main() {
  const base = parseBaseArgument(process.argv.slice(2));
  const violations = findMigrationViolations(collectChanges(base));
  if (violations.length > 0) {
    for (const violation of violations) {
      process.stderr.write(`[check:migrations] ${violation}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write("[check:migrations] ok\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
