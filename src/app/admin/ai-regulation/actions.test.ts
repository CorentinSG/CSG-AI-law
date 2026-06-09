import { beforeEach, describe, expect, it, vi } from "vitest";

const queueAndDrainScanJob = vi.fn();
const recoverStaleRunningScanJobs = vi.fn();
const processNextQueuedScanJob = vi.fn();
const revalidatePath = vi.fn();
const assertAdminServerActionAccess = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/admin-auth", () => ({
  assertAdminServerActionAccess,
}));

vi.mock("@/agents/ai-regulation/processors/scanJobs", () => ({
  queueAndDrainScanJob,
  recoverStaleRunningScanJobs,
  processNextQueuedScanJob,
}));

describe("admin ai-regulation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAdminServerActionAccess.mockResolvedValue(undefined);
    queueAndDrainScanJob.mockResolvedValue(undefined);
    processNextQueuedScanJob.mockResolvedValue(undefined);
    recoverStaleRunningScanJobs.mockResolvedValue(undefined);
  });

  it("triggerSourceScan uses queue-drain semantics for manual scans", async () => {
    const { triggerSourceScan } = await import("@/app/admin/ai-regulation/actions");
    const formData = new FormData();
    formData.set("sourceId", "src-federal-register-ai");

    await triggerSourceScan(formData);

    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "admin-action",
      leaseOwner: "admin-action",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/ai-regulation");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/admin/ai-regulation/sources/src-federal-register-ai",
    );
  });

  it("drainNextQueuedJob claims work under the admin-action lease owner", async () => {
    const { drainNextQueuedJob } = await import("@/app/admin/ai-regulation/actions");

    await drainNextQueuedJob();

    expect(processNextQueuedScanJob).toHaveBeenCalledWith({
      leaseOwner: "admin-action",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/ai-regulation");
  });
});
