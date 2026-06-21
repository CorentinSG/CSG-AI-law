import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");
const preservedEntries = new Set(["cache"]);

try {
  const entries = await readdir(nextDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => !preservedEntries.has(entry.name))
      .map((entry) =>
        rm(path.join(nextDir, entry.name), {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 250,
        }),
      ),
  );
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    process.exit(0);
  }
  console.error("[clean-next] Failed to clean .next directory.");
  console.error(error);
  process.exitCode = 1;
}
