import { config } from "dotenv";
import { Client } from "pg";

import {
  evaluateSchemaIntegrity,
  mapCatalogQueryResults,
  type SchemaSnapshot,
} from "../src/db/schema-integrity";

config({ path: ".env.local", quiet: true });

const TABLES = [
  "raw_regulatory_items",
  "ai_regulatory_updates",
  "scan_jobs",
  "regulation_sources",
  "news_items",
];

async function loadSnapshot(client: Client): Promise<SchemaSnapshot> {
  const results = await Promise.all([
    client.query(
      `select c.relname as "tableName", c.relrowsecurity as "rlsEnabled"
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = any($1::text[])`,
      [TABLES],
    ),
    client.query(
      `select table_name as "tableName", column_name as "columnName"
       from information_schema.columns
       where table_schema = 'public' and table_name = any($1::text[])`,
      [TABLES],
    ),
    client.query(
      `select tablename as "tableName", indexname as "indexName", indexdef as "indexDefinition"
       from pg_indexes where schemaname = 'public' and tablename = any($1::text[])`,
      [TABLES],
    ),
    client.query(
      `select c.relname as "tableName", con.conname as "constraintName",
              case con.contype when 'c' then 'CHECK' when 'u' then 'UNIQUE'
                   when 'p' then 'PRIMARY KEY' when 'f' then 'FOREIGN KEY' else con.contype::text end
                as "constraintType",
              pg_get_constraintdef(con.oid) as "constraintDefinition"
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = any($1::text[])`,
      [TABLES],
    ),
    client.query(
      `select tablename as "tableName", policyname as "policyName"
       from pg_policies where schemaname = 'public' and tablename = any($1::text[])`,
      [TABLES],
    ),
  ]);

  return mapCatalogQueryResults(results);
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    process.stderr.write("[audit:database-schema] blocked_missing_credentials DATABASE_URL\n");
    process.exitCode = 2;
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    const report = evaluateSchemaIntegrity(await loadSnapshot(client));
    if (report.ok) {
      process.stdout.write("[audit:database-schema] ok\n");
      return;
    }
    for (const finding of report.findings) {
      process.stdout.write(
        `[audit:database-schema] ${finding.objectName} ${finding.invariantClass}\n`,
      );
    }
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const errorClass = error instanceof Error ? error.name : "UnknownError";
  process.stderr.write(`[audit:database-schema] failed ${errorClass}\n`);
  process.exitCode = 1;
});
