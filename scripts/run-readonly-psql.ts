import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { parseDatabaseUrl } from "../src/lib/env";

interface PsqlSpawnOptions {
  env: NodeJS.ProcessEnv;
  stdio: "inherit";
}

interface PsqlSpawnResult {
  error?: unknown;
  status: number | null;
}

export type PsqlSpawn = (
  command: string,
  args: string[],
  options: PsqlSpawnOptions,
) => PsqlSpawnResult;

const spawnPsqlDefault: PsqlSpawn = (command, args, options) =>
  spawnSync(command, args, options);

function decodeUrlComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error("DATABASE_URL contains invalid percent encoding");
  }
}

function buildPsqlEnv(
  databaseUrl: string,
  sourceEnv: NodeJS.ProcessEnv,
  sourceName: string,
) {
  const parsed = new URL(databaseUrl);
  const password = decodeUrlComponent(parsed.password);
  const database = decodeUrlComponent(parsed.pathname.slice(1));
  if (!password || !database) {
    throw new Error("DATABASE_URL must include a password and database name");
  }

  const childEnv = { ...sourceEnv };
  for (const key of Object.keys(childEnv)) {
    if (key === "DATABASE_URL" || key.endsWith("_DATABASE_URL")) {
      delete childEnv[key];
    }
  }
  delete childEnv[sourceName];

  return {
    ...childEnv,
    PGHOST: parsed.hostname,
    PGPORT: parsed.port,
    PGUSER: decodeUrlComponent(parsed.username),
    PGPASSWORD: password,
    PGDATABASE: database,
    PGSSLMODE: parsed.searchParams.get("sslmode") ?? "",
    PGOPTIONS: parsed.searchParams.get("options") ?? "",
  };
}

export function runReadonlyPsql(
  argv: string[] = process.argv.slice(2),
  sourceEnv: NodeJS.ProcessEnv = process.env,
  spawnPsql: PsqlSpawn = spawnPsqlDefault,
) {
  const [sourceName, ...psqlArgs] = argv;
  if (!sourceName || !/^[A-Z][A-Z0-9_]*DATABASE_URL$/.test(sourceName)) {
    throw new Error("A named DATABASE_URL environment variable is required");
  }

  const databaseUrl = parseDatabaseUrl(sourceEnv[sourceName]);
  if (!databaseUrl) {
    throw new Error(`${sourceName} is required`);
  }

  const result = spawnPsql("psql", psqlArgs, {
    env: buildPsqlEnv(databaseUrl, sourceEnv, sourceName),
    stdio: "inherit",
  });
  if (result.error) {
    throw new Error("Unable to start psql");
  }
  if (result.status === null) {
    throw new Error("psql terminated without an exit status");
  }
  return result.status;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = runReadonlyPsql();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`[readonly-psql] ${message}\n`);
    process.exitCode = 1;
  }
}
