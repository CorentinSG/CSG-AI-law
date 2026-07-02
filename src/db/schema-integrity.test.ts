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
      { tableName: "raw_regulatory_items", indexName: "raw_regulatory_items_hash_unique_idx", indexDefinition: "CREATE UNIQUE INDEX raw_regulatory_items_hash_unique_idx ON public.raw_regulatory_items USING btree (hash)" },
      { tableName: "raw_regulatory_items", indexName: "raw_regulatory_items_source_id_idx", indexDefinition: "CREATE INDEX raw_regulatory_items_source_id_idx ON public.raw_regulatory_items USING btree (source_id)" },
      { tableName: "ai_regulatory_updates", indexName: "ai_regulatory_updates_status_idx", indexDefinition: "CREATE INDEX ai_regulatory_updates_status_idx ON public.ai_regulatory_updates USING btree (status)" },
      { tableName: "ai_regulatory_updates", indexName: "ai_regulatory_updates_source_id_idx", indexDefinition: "CREATE INDEX ai_regulatory_updates_source_id_idx ON public.ai_regulatory_updates USING btree (source_id)" },
      { tableName: "ai_regulatory_updates", indexName: "ai_regulatory_updates_publication_date_idx", indexDefinition: "CREATE INDEX ai_regulatory_updates_publication_date_idx ON public.ai_regulatory_updates USING btree (publication_date DESC)" },
      { tableName: "scan_jobs", indexName: "scan_jobs_created_at_idx", indexDefinition: "CREATE INDEX scan_jobs_created_at_idx ON public.scan_jobs USING btree (created_at DESC)" },
      { tableName: "scan_jobs", indexName: "scan_jobs_status_idx", indexDefinition: "CREATE INDEX scan_jobs_status_idx ON public.scan_jobs USING btree (status, created_at DESC)" },
      { tableName: "news_items", indexName: "news_items_slug_key", indexDefinition: "CREATE UNIQUE INDEX news_items_slug_key ON public.news_items USING btree (slug)" },
      { tableName: "news_items", indexName: "news_items_visibility_idx", indexDefinition: "CREATE INDEX news_items_visibility_idx ON public.news_items USING btree (public_visibility_status, publication_date DESC, detected_at DESC)" },
      { tableName: "news_items", indexName: "news_items_raw_item_idx", indexDefinition: "CREATE INDEX news_items_raw_item_idx ON public.news_items USING btree (raw_item_id)" },
    ],
    constraints: [
      { tableName: "regulation_sources", constraintName: "regulation_sources_source_type_check", constraintType: "CHECK", constraintDefinition: "CHECK ((source_type = ANY (ARRAY['RSS'::text, 'API'::text])))" },
      { tableName: "regulation_sources", constraintName: "regulation_sources_reliability_check", constraintType: "CHECK", constraintDefinition: "CHECK ((reliability_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])))" },
      { tableName: "raw_regulatory_items", constraintName: "raw_regulatory_items_processing_status_check", constraintType: "CHECK", constraintDefinition: "CHECK ((processing_status = ANY (ARRAY['new'::text, 'duplicate'::text, 'processed'::text, 'failed'::text])))" },
      { tableName: "ai_regulatory_updates", constraintName: "ai_regulatory_updates_status_check", constraintType: "CHECK", constraintDefinition: "CHECK ((status = ANY (ARRAY['needs_review'::text, 'approved'::text, 'rejected'::text, 'published'::text, 'archived'::text])))" },
      { tableName: "scan_jobs", constraintName: "scan_jobs_status_check", constraintType: "CHECK", constraintDefinition: "CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'succeeded'::text, 'partial_success'::text, 'failed'::text])))" },
      { tableName: "news_items", constraintName: "news_items_visibility_check", constraintType: "CHECK", constraintDefinition: "CHECK ((public_visibility_status = ANY (ARRAY['public'::text, 'admin_only'::text])))" },
    ],
    tables: Object.keys(columnsByTable).map((tableName) => ({ tableName, rlsEnabled: true })),
    policies: [
      { tableName: "regulation_sources", policyName: "service_role_all_regulation_sources" },
      { tableName: "raw_regulatory_items", policyName: "service_role_all_raw_regulatory_items" },
      { tableName: "ai_regulatory_updates", policyName: "public_published_updates_select" },
      { tableName: "scan_jobs", policyName: "service_role_all_scan_jobs" },
      { tableName: "news_items", policyName: "Public can read visible news items" },
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
    index.indexDefinition =
      "CREATE INDEX scan_jobs_created_at_idx ON public.scan_jobs USING btree (created_at_extra DESC)";

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "scan_jobs.scan_jobs_created_at_idx",
      invariantClass: "index",
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
      indexDefinition: "CREATE INDEX index_name ON index_row (id)",
    }];
    const constraints = [{
      tableName: "constraint_row",
      constraintName: "constraint_name",
      constraintType: "CHECK",
      constraintDefinition: "CHECK (true)",
    }];
    const policies = [{ tableName: "policy_row", policyName: "policy_name" }];

    expect(mapCatalogQueryResults([
      { rows: tables },
      { rows: columns },
      { rows: indexes },
      { rows: constraints },
      { rows: policies },
    ])).toEqual({ tables, columns, indexes, constraints, policies });
  });
});
