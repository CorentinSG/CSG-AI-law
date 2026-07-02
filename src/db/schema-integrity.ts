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
  indexes: Array<{ tableName: string; indexName: string; indexDefinition: string }>;
  constraints: Array<{
    tableName: string;
    constraintName: string;
    constraintType: string;
    constraintDefinition: string;
  }>;
  tables: Array<{ tableName: string; rlsEnabled: boolean }>;
  policies: Array<{ tableName: string; policyName: string }>;
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
    definition: string;
    objectName: string;
    requiredValues?: string[];
  }>;
  policies: string[];
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
        definition: "source_type",
        objectName: "regulation_sources.source_type",
      },
      {
        name: "regulation_sources_reliability_check",
        type: "CHECK",
        definition: "reliability_level",
        objectName: "regulation_sources.reliability_level",
      },
    ],
    policies: ["service_role_all_regulation_sources"],
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
        definition: "processing_status",
        objectName: "raw_regulatory_items.processing_status",
      },
    ],
    policies: ["service_role_all_raw_regulatory_items"],
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
        definition: "status",
        objectName: "ai_regulatory_updates.status",
      },
    ],
    policies: ["public_published_updates_select"],
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
        definition: "status",
        objectName: "scan_jobs.status",
        requiredValues: ["queued", "running", "succeeded", "partial_success", "failed"],
      },
    ],
    policies: ["service_role_all_scan_jobs"],
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
        definition: "public_visibility_status",
        objectName: "news_items.public_visibility_status",
      },
    ],
    policies: ["Public can read visible news items"],
  },
};

function normalized(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ");
}

function indexColumns(indexDefinition: string): string[] {
  const match = indexDefinition.match(/\(([^()]*)\)(?:\s+where\b.*)?$/i);
  if (!match) {
    return [];
  }
  return match[1].split(",").map((part) =>
    part
      .trim()
      .replace(/\s+(asc|desc)(\s+nulls\s+(first|last))?$/i, "")
      .replace(/^"|"$/g, "")
      .toLowerCase(),
  );
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
      const definitionMatches = actual &&
        indexColumns(actual.indexDefinition).join(",") === index.columns.join(",");
      const uniqueMatches = !index.unique ||
        (actual && normalized(actual.indexDefinition).includes("unique"));
      if (!definitionMatches || !uniqueMatches) {
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
          normalized(row.constraintDefinition).includes(normalized(constraint.definition)) &&
          (!constraint.requiredValues ||
            quotedValues(row.constraintDefinition).join(",") ===
              [...constraint.requiredValues].sort().join(",")),
      );
      if (!actual) {
        findings.push({
          objectName: constraint.objectName,
          invariantClass: constraint.type === "CHECK" ? "check_constraint" : "constraint",
        });
      }
    }

    const hasRequiredPolicy = requirement.policies.some((policyName) =>
      snapshot.policies.some(
        (row) => row.tableName === tableName && row.policyName === policyName,
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
