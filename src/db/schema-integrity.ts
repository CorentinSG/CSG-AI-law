export type InvariantClass =
  | "column"
  | "index"
  | "unique_index"
  | "check_constraint"
  | "constraint"
  | "rls_policy";

export interface SchemaFinding {
  objectName: string;
  invariantClass: InvariantClass;
}

export interface SchemaSnapshot {
  columns: Array<{ tableName: string; columnName: string }>;
  indexes: Array<{
    tableName: string;
    indexName: string;
    columnNames: string[];
    isUnique: boolean;
    isValid: boolean;
    predicate: string | null;
  }>;
  constraints: Array<{
    tableName: string;
    constraintName: string;
    constraintType: string;
    columnNames: string[];
    isValidated: boolean;
    constraintDefinition: string;
  }>;
  tables: Array<{ tableName: string; rlsEnabled: boolean }>;
  policies: Array<{
    tableName: string;
    policyName: string;
    command: string;
    roles: string[];
    usingExpression: string | null;
    checkExpression: string | null;
  }>;
}

type CatalogQueryResults = [
  { rows: SchemaSnapshot["tables"] },
  { rows: SchemaSnapshot["columns"] },
  { rows: SchemaSnapshot["indexes"] },
  { rows: SchemaSnapshot["constraints"] },
  { rows: SchemaSnapshot["policies"] },
];

export function mapCatalogQueryResults(
  [tables, columns, indexes, constraints, policies]: CatalogQueryResults,
): SchemaSnapshot {
  return {
    tables: tables.rows,
    columns: columns.rows,
    indexes: indexes.rows,
    constraints: constraints.rows,
    policies: policies.rows,
  };
}

interface TableRequirement {
  columns: string[];
  indexes: Array<{ name: string; columns: string[]; unique?: boolean }>;
  constraints: Array<{
    name: string;
    type: string;
    columns: string[];
    objectName: string;
    requiredValues: string[];
  }>;
  policies: Array<{
    name: string;
    command: string;
    roles: string[];
    usingExpression: string;
    checkExpression: string | null;
  }>;
}

export const REQUIRED_SCHEMA_INVARIANTS: Record<string, TableRequirement> = {
  regulation_sources: {
    columns: [
      "id", "name", "jurisdiction", "region", "country", "source_url", "source_type",
      "scan_frequency", "active", "reliability_level", "config", "created_at", "updated_at",
    ],
    indexes: [],
    constraints: [
      {
        name: "regulation_sources_source_type_check",
        type: "CHECK",
        columns: ["source_type"],
        objectName: "regulation_sources.source_type",
        requiredValues: [
          "RSS", "API", "static_page", "dynamic_page", "PDF_repository",
          "legislative_database", "regulator_page", "court_database",
          "standards_body", "tracker_source", "discovery_source", "media_source",
        ],
      },
      {
        name: "regulation_sources_reliability_check",
        type: "CHECK",
        columns: ["reliability_level"],
        objectName: "regulation_sources.reliability_level",
        requiredValues: ["high", "medium", "low"],
      },
    ],
    policies: [{
      name: "service_role_all_regulation_sources",
      command: "ALL",
      roles: ["service_role"],
      usingExpression: "auth.role() = 'service_role'",
      checkExpression: "auth.role() = 'service_role'",
    }],
  },
  raw_regulatory_items: {
    columns: [
      "id", "source_id", "raw_title", "raw_url", "raw_text", "raw_metadata", "detected_at",
      "hash", "duplicate_of", "processing_status", "created_at", "updated_at",
    ],
    indexes: [
      {
        name: "raw_regulatory_items_hash_unique_idx",
        columns: ["hash"],
        unique: true,
      },
      { name: "raw_regulatory_items_source_id_idx", columns: ["source_id"] },
    ],
    constraints: [
      {
        name: "raw_regulatory_items_processing_status_check",
        type: "CHECK",
        columns: ["processing_status"],
        objectName: "raw_regulatory_items.processing_status",
        requiredValues: ["new", "duplicate", "processed", "failed", "classified"],
      },
    ],
    policies: [{
      name: "service_role_all_raw_regulatory_items",
      command: "ALL",
      roles: ["service_role"],
      usingExpression: "auth.role() = 'service_role'",
      checkExpression: "auth.role() = 'service_role'",
    }],
  },
  ai_regulatory_updates: {
    columns: [
      "id", "source_id", "raw_item_id", "title", "source_name", "source_url",
      "jurisdiction", "region", "country", "development_type", "legal_area", "authority_type",
      "publication_date", "detected_date", "summary", "importance_level", "confidence_level",
      "status", "created_at", "updated_at",
    ],
    indexes: [
      { name: "ai_regulatory_updates_status_idx", columns: ["status"] },
      { name: "ai_regulatory_updates_source_id_idx", columns: ["source_id"] },
      { name: "ai_regulatory_updates_publication_date_idx", columns: ["publication_date"] },
    ],
    constraints: [
      {
        name: "ai_regulatory_updates_status_check",
        type: "CHECK",
        columns: ["status"],
        objectName: "ai_regulatory_updates.status",
        requiredValues: ["needs_review", "approved", "rejected", "published", "archived"],
      },
    ],
    policies: [{
      name: "public_published_updates_select",
      command: "SELECT",
      roles: ["anon", "authenticated"],
      usingExpression: "status = 'published'",
      checkExpression: null,
    }],
  },
  scan_jobs: {
    columns: [
      "id", "source_id", "trigger", "requested_by", "status", "started_at", "finished_at",
      "result_summary", "error_message", "created_at", "updated_at",
    ],
    indexes: [
      { name: "scan_jobs_created_at_idx", columns: ["created_at"] },
      { name: "scan_jobs_status_idx", columns: ["status", "created_at"] },
    ],
    constraints: [
      {
        name: "scan_jobs_status_check",
        type: "CHECK",
        columns: ["status"],
        objectName: "scan_jobs.status",
        requiredValues: ["queued", "running", "succeeded", "partial_success", "failed"],
      },
    ],
    policies: [{
      name: "service_role_all_scan_jobs",
      command: "ALL",
      roles: ["service_role"],
      usingExpression: "auth.role() = 'service_role'",
      checkExpression: "auth.role() = 'service_role'",
    }],
  },
  news_items: {
    columns: [
      "id", "regulatory_update_id", "raw_item_id", "slug", "title", "short_summary",
      "full_summary", "detected_at", "publication_date", "source_name", "source_url",
      "source_type", "source_reliability", "source_jurisdiction", "jurisdiction", "region",
      "country_or_state", "legal_area", "authority_type", "development_type",
      "verification_status", "public_visibility_status", "created_at", "updated_at",
    ],
    indexes: [
      { name: "news_items_slug_key", columns: ["slug"], unique: true },
      { name: "news_items_visibility_idx", columns: ["public_visibility_status", "publication_date", "detected_at"] },
      { name: "news_items_raw_item_idx", columns: ["raw_item_id"] },
    ],
    constraints: [
      {
        name: "news_items_visibility_check",
        type: "CHECK",
        columns: ["public_visibility_status"],
        objectName: "news_items.public_visibility_status",
        requiredValues: ["public", "admin_only"],
      },
    ],
    policies: [{
      name: "Public can read visible news items",
      command: "SELECT",
      roles: ["anon", "authenticated"],
      usingExpression: "public_visibility_status = 'public'",
      checkExpression: null,
    }],
  },
};

function normalizedExpression(value: string | null) {
  return value
    ?.toLowerCase()
    .replace(/::(?:text|name)/g, "")
    .replace(/[\s()]+/g, "") ?? null;
}

function quotedValues(definition: string): string[] {
  return [...definition.matchAll(/'([^']+)'/g)]
    .map((match) => match[1].toLowerCase())
    .sort();
}

export function evaluateSchemaIntegrity(snapshot: SchemaSnapshot): {
  ok: boolean;
  findings: SchemaFinding[];
} {
  const findings: SchemaFinding[] = [];

  for (const [tableName, requirement] of Object.entries(REQUIRED_SCHEMA_INVARIANTS)) {
    for (const columnName of requirement.columns) {
      if (!snapshot.columns.some((row) => row.tableName === tableName && row.columnName === columnName)) {
        findings.push({ objectName: `${tableName}.${columnName}`, invariantClass: "column" });
      }
    }

    for (const index of requirement.indexes) {
      const actual = snapshot.indexes.find(
        (row) => row.tableName === tableName && row.indexName === index.name,
      );
      const structurallyMatches =
        actual?.isValid === true &&
        actual.predicate === null &&
        actual.columnNames.join(",") === index.columns.join(",") &&
        (!index.unique || actual.isUnique);
      if (!structurallyMatches) {
        findings.push({
          objectName: `${tableName}.${index.name}`,
          invariantClass: index.unique ? "unique_index" : "index",
        });
      }
    }

    for (const constraint of requirement.constraints) {
      const actual = snapshot.constraints.find(
        (row) =>
          row.tableName === tableName &&
          row.constraintName === constraint.name &&
          row.constraintType.toUpperCase() === constraint.type &&
          row.isValidated &&
          row.columnNames.join(",") === constraint.columns.join(",") &&
          quotedValues(row.constraintDefinition).join(",") ===
            constraint.requiredValues.map((value) => value.toLowerCase()).sort().join(","),
      );
      if (!actual) {
        findings.push({
          objectName: constraint.objectName,
          invariantClass: constraint.type === "CHECK" ? "check_constraint" : "constraint",
        });
      }
    }

    const hasRequiredPolicy = requirement.policies.some((requiredPolicy) =>
      snapshot.policies.some(
        (row) =>
          row.tableName === tableName &&
          row.policyName === requiredPolicy.name &&
          row.command.toUpperCase() === requiredPolicy.command &&
          [...row.roles].sort().join(",") ===
            [...requiredPolicy.roles].sort().join(",") &&
          normalizedExpression(row.usingExpression) ===
            normalizedExpression(requiredPolicy.usingExpression) &&
          normalizedExpression(row.checkExpression) ===
            normalizedExpression(requiredPolicy.checkExpression),
      ),
    );
    const hasRlsEnabled = snapshot.tables.some(
      (row) => row.tableName === tableName && row.rlsEnabled,
    );
    if (!hasRlsEnabled || !hasRequiredPolicy) {
      findings.push({ objectName: tableName, invariantClass: "rls_policy" });
    }
  }

  return { ok: findings.length === 0, findings };
}
