import { describe, expect, it } from "vitest";

import {
  evaluateSchemaIntegrity,
  mapCatalogQueryResults,
  type SchemaSnapshot,
} from "./schema-integrity";

function completeSnapshot(): SchemaSnapshot {
  const columnsByTable: Record<string, string[]> = {
    regulation_sources: [
      "id", "name", "jurisdiction", "region", "country", "source_url", "source_type",
      "scan_frequency", "active", "reliability_level", "config", "created_at", "updated_at",
    ],
    raw_regulatory_items: [
      "id", "source_id", "raw_title", "raw_url", "raw_text", "raw_metadata", "detected_at",
      "hash", "duplicate_of", "processing_status", "created_at", "updated_at",
    ],
    ai_regulatory_updates: [
      "id", "source_id", "raw_item_id", "title", "source_name", "source_url",
      "jurisdiction", "region", "country", "development_type", "legal_area", "authority_type",
      "publication_date", "detected_date", "summary", "importance_level", "confidence_level",
      "status", "created_at", "updated_at",
    ],
    scan_jobs: [
      "id", "source_id", "trigger", "requested_by", "status", "started_at", "finished_at",
      "result_summary", "error_message", "created_at", "updated_at",
    ],
    news_items: [
      "id", "regulatory_update_id", "raw_item_id", "slug", "title", "short_summary",
      "full_summary", "detected_at", "publication_date", "source_name", "source_url",
      "source_type", "source_reliability", "source_jurisdiction", "jurisdiction", "region",
      "country_or_state", "legal_area", "authority_type", "development_type",
      "verification_status", "public_visibility_status", "created_at", "updated_at",
    ],
  };

  return {
    columns: Object.entries(columnsByTable).flatMap(([tableName, columnNames]) =>
      columnNames.map((columnName) => ({ tableName, columnName })),
    ),
    indexes: [
      { tableName: "raw_regulatory_items", indexName: "raw_regulatory_items_hash_unique_idx", columnNames: ["hash"], isUnique: true, isValid: true, predicate: null },
      { tableName: "raw_regulatory_items", indexName: "raw_regulatory_items_source_id_idx", columnNames: ["source_id"], isUnique: false, isValid: true, predicate: null },
      { tableName: "ai_regulatory_updates", indexName: "ai_regulatory_updates_status_idx", columnNames: ["status"], isUnique: false, isValid: true, predicate: null },
      { tableName: "ai_regulatory_updates", indexName: "ai_regulatory_updates_source_id_idx", columnNames: ["source_id"], isUnique: false, isValid: true, predicate: null },
      { tableName: "ai_regulatory_updates", indexName: "ai_regulatory_updates_publication_date_idx", columnNames: ["publication_date"], isUnique: false, isValid: true, predicate: null },
      { tableName: "scan_jobs", indexName: "scan_jobs_created_at_idx", columnNames: ["created_at"], isUnique: false, isValid: true, predicate: null },
      { tableName: "scan_jobs", indexName: "scan_jobs_status_idx", columnNames: ["status", "created_at"], isUnique: false, isValid: true, predicate: null },
      { tableName: "news_items", indexName: "news_items_slug_key", columnNames: ["slug"], isUnique: true, isValid: true, predicate: null },
      { tableName: "news_items", indexName: "news_items_visibility_idx", columnNames: ["public_visibility_status", "publication_date", "detected_at"], isUnique: false, isValid: true, predicate: null },
      { tableName: "news_items", indexName: "news_items_raw_item_idx", columnNames: ["raw_item_id"], isUnique: false, isValid: true, predicate: null },
    ].map((index) => ({
      ...index,
      indexDefinition: `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX ${index.indexName} ON public.${index.tableName} (${index.columnNames.join(", ")})`,
    })),
    constraints: [
      { tableName: "regulation_sources", constraintName: "regulation_sources_source_type_check", constraintType: "CHECK", columnNames: ["source_type"], isValidated: true, constraintDefinition: "CHECK ((source_type = ANY (ARRAY['RSS'::text, 'API'::text, 'static_page'::text, 'dynamic_page'::text, 'PDF_repository'::text, 'legislative_database'::text, 'regulator_page'::text, 'court_database'::text, 'standards_body'::text, 'tracker_source'::text, 'discovery_source'::text, 'media_source'::text])))" },
      { tableName: "regulation_sources", constraintName: "regulation_sources_reliability_check", constraintType: "CHECK", columnNames: ["reliability_level"], isValidated: true, constraintDefinition: "CHECK ((reliability_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])))" },
      { tableName: "raw_regulatory_items", constraintName: "raw_regulatory_items_processing_status_check", constraintType: "CHECK", columnNames: ["processing_status"], isValidated: true, constraintDefinition: "CHECK ((processing_status = ANY (ARRAY['new'::text, 'duplicate'::text, 'processed'::text, 'failed'::text, 'classified'::text])))" },
      { tableName: "ai_regulatory_updates", constraintName: "ai_regulatory_updates_status_check", constraintType: "CHECK", columnNames: ["status"], isValidated: true, constraintDefinition: "CHECK ((status = ANY (ARRAY['needs_review'::text, 'approved'::text, 'rejected'::text, 'published'::text, 'archived'::text])))" },
      { tableName: "scan_jobs", constraintName: "scan_jobs_status_check", constraintType: "CHECK", columnNames: ["status"], isValidated: true, constraintDefinition: "CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'succeeded'::text, 'partial_success'::text, 'failed'::text])))" },
      { tableName: "news_items", constraintName: "news_items_visibility_check", constraintType: "CHECK", columnNames: ["public_visibility_status"], isValidated: true, constraintDefinition: "CHECK ((public_visibility_status = ANY (ARRAY['public'::text, 'admin_only'::text])))" },
    ],
    tables: Object.keys(columnsByTable).map((tableName) => ({ tableName, rlsEnabled: true })),
    policies: [
      { tableName: "regulation_sources", policyName: "service_role_all_regulation_sources", command: "ALL", roles: ["service_role"], usingExpression: "(auth.role() = 'service_role'::text)", checkExpression: "(auth.role() = 'service_role'::text)" },
      { tableName: "raw_regulatory_items", policyName: "service_role_all_raw_regulatory_items", command: "ALL", roles: ["service_role"], usingExpression: "(auth.role() = 'service_role'::text)", checkExpression: "(auth.role() = 'service_role'::text)" },
      { tableName: "ai_regulatory_updates", policyName: "public_published_updates_select", command: "SELECT", roles: ["anon", "authenticated"], usingExpression: "(status = 'published'::text)", checkExpression: null },
      { tableName: "scan_jobs", policyName: "service_role_all_scan_jobs", command: "ALL", roles: ["service_role"], usingExpression: "(auth.role() = 'service_role'::text)", checkExpression: "(auth.role() = 'service_role'::text)" },
      { tableName: "news_items", policyName: "Public can read visible news items", command: "SELECT", roles: ["anon", "authenticated"], usingExpression: "(public_visibility_status = 'public'::text)", checkExpression: null },
    ],
  };
}

describe("evaluateSchemaIntegrity", () => {
  it("reports a missing unique invariant for raw_regulatory_items.hash", () => {
    const snapshot = completeSnapshot();
    snapshot.indexes = snapshot.indexes.filter(
      (index) => index.indexName !== "raw_regulatory_items_hash_unique_idx",
    );

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "raw_regulatory_items.raw_regulatory_items_hash_unique_idx",
      invariantClass: "unique_index",
    });
  });

  it("does not infer uniqueness from an index name", () => {
    const snapshot = completeSnapshot();
    const index = snapshot.indexes.find(
      (row) => row.indexName === "raw_regulatory_items_hash_unique_idx",
    )!;
    index.isUnique = false;

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "raw_regulatory_items.raw_regulatory_items_hash_unique_idx",
      invariantClass: "unique_index",
    });
  });

  it("reports a missing check constraint for scan_jobs.status", () => {
    const snapshot = completeSnapshot();
    snapshot.constraints = snapshot.constraints.filter(
      (constraint) => constraint.constraintName !== "scan_jobs_status_check",
    );

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "scan_jobs.status",
      invariantClass: "check_constraint",
    });
  });

  it("reports missing RLS when an application table has no policy", () => {
    const snapshot = completeSnapshot();
    snapshot.policies = snapshot.policies.filter(
      (policy) => policy.tableName !== "regulation_sources",
    );

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "regulation_sources",
      invariantClass: "rls_policy",
    });
  });

  it("reports missing RLS when policies exist but row security is disabled", () => {
    const snapshot = completeSnapshot();
    snapshot.tables = snapshot.tables.map((table) =>
      table.tableName === "news_items" ? { ...table, rlsEnabled: false } : table,
    );

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "news_items",
      invariantClass: "rls_policy",
    });
  });

  it.each([
    ["command", { command: "SELECT" }],
    ["roles", { roles: ["authenticated"] }],
    ["using expression", { usingExpression: "true" }],
    ["check expression", { checkExpression: "true" }],
  ])("rejects a service policy with the wrong %s", (_label, patch) => {
    const snapshot = completeSnapshot();
    const policy = snapshot.policies.find(
      (row) => row.policyName === "service_role_all_scan_jobs",
    )!;
    Object.assign(policy, patch);

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "scan_jobs",
      invariantClass: "rls_policy",
    });
  });

  it("rejects a same-named scan_jobs status check with a weaker domain", () => {
    const snapshot = completeSnapshot();
    const constraint = snapshot.constraints.find(
      (row) => row.constraintName === "scan_jobs_status_check",
    )!;
    constraint.constraintDefinition =
      "CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text])))";

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "scan_jobs.status",
      invariantClass: "check_constraint",
    });
  });

  it("rejects an index whose column only shares the required prefix", () => {
    const snapshot = completeSnapshot();
    const index = snapshot.indexes.find(
      (row) => row.indexName === "scan_jobs_created_at_idx",
    )!;
    index.columnNames = ["created_at_extra"];

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "scan_jobs.scan_jobs_created_at_idx",
      invariantClass: "index",
    });
  });

  it.each([
    ["regulation_sources_source_type_check", "regulation_sources.source_type"],
    ["regulation_sources_reliability_check", "regulation_sources.reliability_level"],
    ["raw_regulatory_items_processing_status_check", "raw_regulatory_items.processing_status"],
    ["ai_regulatory_updates_status_check", "ai_regulatory_updates.status"],
    ["news_items_visibility_check", "news_items.public_visibility_status"],
  ])("rejects a weakened %s domain", (constraintName, objectName) => {
    const snapshot = completeSnapshot();
    const constraint = snapshot.constraints.find(
      (row) => row.constraintName === constraintName,
    )!;
    constraint.constraintDefinition = constraint.constraintDefinition.replace(
      /,\s*'[^']+'::text(?=\]\)\)\))?/,
      "",
    );

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName,
      invariantClass: "check_constraint",
    });
  });

  it("accepts a complete schema snapshot", () => {
    expect(evaluateSchemaIntegrity(completeSnapshot())).toEqual({
      ok: true,
      findings: [],
    });
  });
});

describe("mapCatalogQueryResults", () => {
  it("maps runtime query results to the matching snapshot collections", () => {
    const tables = [{ tableName: "table_row", rlsEnabled: true }];
    const columns = [{ tableName: "column_row", columnName: "id" }];
    const indexes = [{
      tableName: "index_row",
      indexName: "index_name",
      columnNames: ["id"],
      isUnique: false,
      isValid: true,
      predicate: null,
      indexDefinition: "CREATE INDEX index_name ON index_row (id)",
    }];
    const constraints = [{
      tableName: "constraint_row",
      constraintName: "constraint_name",
      constraintType: "CHECK",
      columnNames: ["enabled"],
      isValidated: true,
      constraintDefinition: "CHECK (true)",
    }];
    const policies = [{
      tableName: "policy_row",
      policyName: "policy_name",
      command: "SELECT",
      roles: ["anon"],
      usingExpression: "true",
      checkExpression: null,
    }];

    expect(mapCatalogQueryResults([
      { rows: tables },
      { rows: columns },
      { rows: indexes },
      { rows: constraints },
      { rows: policies },
    ])).toEqual({ tables, columns, indexes, constraints, policies });
  });
});
