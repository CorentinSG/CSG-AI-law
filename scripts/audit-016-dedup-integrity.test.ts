import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("audit-016 forensic transaction contract", () => {
  it("captures all forensic queries in a repeatable-read read-only snapshot", async () => {
    const sql = await readFile(
      new URL("./audit-016-dedup-integrity.sql", import.meta.url),
      "utf8",
    );

    expect(sql).toMatch(
      /begin transaction isolation level repeatable read read only;/i,
    );
    expect(sql.match(/\bbegin\b/gi)).toHaveLength(1);
    expect(sql.match(/\bcommit\b/gi)).toHaveLength(1);
  });
});
