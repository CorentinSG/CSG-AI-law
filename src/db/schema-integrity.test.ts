import { describe, expect, it } from "vitest";

import {
  REQUIRED_SCHEMA_INVARIANTS,
  evaluateSchemaIntegrity,
  type SchemaSnapshot,
} from "./schema-integrity";

function completeSnapshot(): SchemaSnapshot {
  return {
    columns: Object.entries(REQUIRED_SCHEMA_INVARIANTS).flatMap(([tableName, requirement]) =>
      requirement.columns.map((columnName) => ({ tableName, columnName })),
    ),
    indexes: Object.entries(REQUIRED_SCHEMA_INVARIANTS).flatMap(([tableName, requirement]) =>
      requirement.indexes.map((index) => ({
        tableName,
        indexName: index.name,
        indexDefinition: `${index.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX"} ${index.definition}`,
      })),
    ),
    constraints: Object.entries(REQUIRED_SCHEMA_INVARIANTS).flatMap(
      ([tableName, requirement]) =>
        requirement.constraints.map((constraint) => ({
          tableName,
          constraintName: constraint.name,
          constraintType: constraint.type,
          constraintDefinition: constraint.definition,
        })),
    ),
    policies: Object.entries(REQUIRED_SCHEMA_INVARIANTS).flatMap(([tableName, requirement]) =>
      requirement.policies.map((policyName) => ({ tableName, policyName })),
    ),
  };
}

describe("evaluateSchemaIntegrity", () => {
  it("reports a missing unique invariant for raw_regulatory_items.hash", () => {
    const snapshot = completeSnapshot();
    snapshot.indexes = snapshot.indexes.filter(
      (index) => index.indexName !== "raw_regulatory_items_hash_unique_idx",
    );

    expect(evaluateSchemaIntegrity(snapshot).findings).toContainEqual({
      objectName: "raw_regulatory_items.hash",
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

  it("accepts a complete schema snapshot", () => {
    expect(evaluateSchemaIntegrity(completeSnapshot())).toEqual({
      ok: true,
      findings: [],
    });
  });
});
