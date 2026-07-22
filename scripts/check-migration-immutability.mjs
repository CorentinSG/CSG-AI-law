import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HISTORICAL_MIGRATION_PREFIX = "src/db/migrations/";
const SUPABASE_MIGRATION_PREFIX = "supabase/migrations/";
const VERSIONED_MIGRATION = /^supabase\/migrations\/\d{14}_[^/]+\.sql$/;

function isMigrationPath(filePath) {
  return (
    filePath.startsWith(HISTORICAL_MIGRATION_PREFIX) ||
    filePath.startsWith(SUPABASE_MIGRATION_PREFIX)
  );
}

export function findMigrationViolations(changes) {
  const violations = [];

  for (const { status, paths } of changes) {
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

function parseNullFields(output) {
  if (!output) return [];
  if (!output.endsWith("\0")) {
    throw new Error("Git returned malformed non-NUL-terminated output");
  }
  return output.slice(0, -1).split("\0");
}

export function parseGitNameStatusOutput(output) {
  const fields = parseNullFields(output);
  const changes = [];

  for (let index = 0; index < fields.length; ) {
    const status = fields[index];
    index += 1;
    const pathCount = /^[RC]\d+$/.test(status) ? 2 : 1;
    if (index + pathCount > fields.length) {
      throw new Error(`Git returned incomplete path fields for status ${status}`);
    }
    changes.push({ status, paths: fields.slice(index, index + pathCount) });
    index += pathCount;
  }

  return changes;
}

function parseGitPathOutput(output) {
  return parseNullFields(output).map((filePath) => ({
    status: "A",
    paths: [filePath],
  }));
}

function runGit(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

export function collectChanges(base, cwd = process.cwd()) {
  const trackedChanges = base
    ? parseGitNameStatusOutput(
        runGit(
          ["diff", "--name-status", "--find-renames", "-z", `${base}...HEAD`],
          cwd,
        ),
      )
    : [
        ...parseGitNameStatusOutput(
          runGit(
            [
              "diff",
              "--cached",
              "--name-status",
              "--find-renames",
              "-z",
              "HEAD",
            ],
            cwd,
          ),
        ),
        ...parseGitNameStatusOutput(
          runGit(["diff", "--name-status", "--find-renames", "-z"], cwd),
        ),
      ];
  const untrackedChanges = parseGitPathOutput(
    runGit(["ls-files", "--others", "--exclude-standard", "-z"], cwd),
  );

  return [
    ...new Map(
      [...trackedChanges, ...untrackedChanges].map((change) => [
        JSON.stringify(change),
        change,
      ]),
    ).values(),
  ];
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
