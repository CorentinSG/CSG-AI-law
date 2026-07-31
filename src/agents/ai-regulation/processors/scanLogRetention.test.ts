import { beforeEach, describe, expect, it, vi } from "vitest";

const purgeScanLogsBefore = vi.fn();
const purgeSourceHealthChecksBefore = vi.fn();
const purgeResolvedDataQualityFindingsBefore = vi.fn();

vi.mock("./updateRepository", () => ({
  updateRepository: {
    purgeScanLogsBefore,
    purgeSourceHealthChecksBefore,
    purgeResolvedDataQualityFindingsBefore,
  },
}));

const {
  purgeExpiredScanLogs,
  purgeExpiredOperationalRecords,
  retentionCutoff,
  SCAN_LOG_RETENTION_DAYS,
} = await import("./scanLogRetention");

const NOW = new Date("2026-07-30T12:00:00.000Z");

describe("retentionCutoff", () => {
  it("is the retention window before now", () => {
    expect(retentionCutoff(NOW, 30)).toBe("2026-06-30T12:00:00.000Z");
  });

  // Nothing reads further back than the newest 500 rows, so the default must
  // stay well clear of that — but it also must not be so long that the table
  // grows back into the timeout it caused.
  it("defaults to a window no consumer reaches past", () => {
    expect(SCAN_LOG_RETENTION_DAYS).toBeGreaterThanOrEqual(14);
    expect(SCAN_LOG_RETENTION_DAYS).toBeLessThanOrEqual(90);
  });
});

describe("purgeExpiredScanLogs", () => {
  beforeEach(() => {
    purgeScanLogsBefore.mockReset();
  });

  it("stops as soon as a pass comes back short", async () => {
    purgeScanLogsBefore.mockResolvedValueOnce(500).mockResolvedValueOnce(120);

    const result = await purgeExpiredScanLogs({ now: NOW, batchSize: 500, maxBatches: 10 });

    expect(result).toMatchObject({ deleted: 620, batches: 2, drained: true });
    expect(purgeScanLogsBefore).toHaveBeenCalledTimes(2);
  });

  // The first purge faces the whole accumulated backlog. Deleting it in one go
  // would re-create the statement timeout the retention policy exists to
  // prevent, so the run must stop at the cap and finish on later runs.
  it("caps the work per run instead of draining a large backlog at once", async () => {
    purgeScanLogsBefore.mockResolvedValue(500);

    const result = await purgeExpiredScanLogs({ now: NOW, batchSize: 500, maxBatches: 3 });

    expect(result).toMatchObject({ deleted: 1500, batches: 3, drained: false });
    expect(purgeScanLogsBefore).toHaveBeenCalledTimes(3);
  });

  it("does nothing when there is nothing to delete", async () => {
    purgeScanLogsBefore.mockResolvedValueOnce(0);

    const result = await purgeExpiredScanLogs({ now: NOW });

    expect(result).toMatchObject({ deleted: 0, batches: 1, drained: true });
  });

  it("passes the computed cutoff down, not a row count", async () => {
    purgeScanLogsBefore.mockResolvedValueOnce(0);

    await purgeExpiredScanLogs({ now: NOW, retentionDays: 7, batchSize: 250 });

    expect(purgeScanLogsBefore).toHaveBeenCalledWith("2026-07-23T12:00:00.000Z", 250);
  });

  // Housekeeping must never take down a scan run.
  it("reports a repository failure instead of throwing", async () => {
    purgeScanLogsBefore.mockRejectedValueOnce(new Error("statement timeout"));

    const result = await purgeExpiredScanLogs({ now: NOW });

    expect(result.error).toContain("statement timeout");
    expect(result.deleted).toBe(0);
  });

  it("keeps what it already deleted when a later batch fails", async () => {
    purgeScanLogsBefore.mockResolvedValueOnce(500).mockRejectedValueOnce(new Error("boom"));

    const result = await purgeExpiredScanLogs({ now: NOW, batchSize: 500, maxBatches: 5 });

    expect(result.deleted).toBe(500);
    expect(result.error).toContain("boom");
  });
});

describe("purgeExpiredOperationalRecords", () => {
  beforeEach(() => {
    purgeScanLogsBefore.mockReset();
    purgeSourceHealthChecksBefore.mockReset();
    purgeResolvedDataQualityFindingsBefore.mockReset();
  });

  it("runs all three purges and reports each separately", async () => {
    purgeScanLogsBefore.mockResolvedValue(3);
    purgeSourceHealthChecksBefore.mockResolvedValue(2);
    purgeResolvedDataQualityFindingsBefore.mockResolvedValue(0);

    const report = await purgeExpiredOperationalRecords({ now: NOW, batchSize: 500 });

    expect(report.scanLogs).toMatchObject({ deleted: 3, drained: true });
    expect(report.sourceHealthChecks).toMatchObject({ deleted: 2, drained: true });
    expect(report.resolvedFindings).toMatchObject({ deleted: 0, drained: true });
  });

  // Findings keep a longer paper trail than scan noise: 90 days, and the cutoff
  // must reach the repository method, since it is the only thing distinguishing
  // "resolved long ago" from "resolved yesterday".
  it("purges resolved findings on the 90-day window, not the 30-day one", async () => {
    purgeScanLogsBefore.mockResolvedValue(0);
    purgeSourceHealthChecksBefore.mockResolvedValue(0);
    purgeResolvedDataQualityFindingsBefore.mockResolvedValue(0);

    await purgeExpiredOperationalRecords({ now: NOW });

    expect(purgeResolvedDataQualityFindingsBefore).toHaveBeenCalledWith(
      "2026-05-01T12:00:00.000Z",
      500,
    );
    expect(purgeSourceHealthChecksBefore).toHaveBeenCalledWith("2026-06-30T12:00:00.000Z", 500);
  });

  // One table failing must not stop the others from being cleaned.
  it("keeps purging the remaining tables when one fails", async () => {
    purgeScanLogsBefore.mockRejectedValue(new Error("pool exhausted"));
    purgeSourceHealthChecksBefore.mockResolvedValue(5);
    purgeResolvedDataQualityFindingsBefore.mockResolvedValue(1);

    const report = await purgeExpiredOperationalRecords({ now: NOW });

    expect(report.scanLogs.error).toContain("pool exhausted");
    expect(report.sourceHealthChecks).toMatchObject({ deleted: 5 });
    expect(report.resolvedFindings).toMatchObject({ deleted: 1 });
  });
});
