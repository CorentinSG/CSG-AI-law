import { rm } from "node:fs/promises";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");

try {
  await rm(nextDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 250,
  });
} catch (error) {
  console.error("[clean-next] Failed to remove .next directory.");
  console.error(error);
  process.exitCode = 1;
}
