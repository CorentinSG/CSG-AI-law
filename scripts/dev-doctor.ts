const ports = [3000, 3001, 3002, 3005];
const routes = ["/", "/news", "/ai-regulation/europe", "/ai-regulation/united-states"];

async function checkRoute(port: number, route: string) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      signal: AbortSignal.timeout(2500),
    });
    return response.status;
  } catch {
    return null;
  }
}

async function main() {
  console.log("[dev-doctor] checking local preview ports");
  console.log("[dev-doctor] preferred local command: npm run dev:stable");
  console.log("[dev-doctor] preferred local URL: http://127.0.0.1:3001");

  for (const port of ports) {
    const statuses = Object.fromEntries(
      await Promise.all(
        routes.map(async (route) => [route, await checkRoute(port, route)] as const),
      ),
    );
    const reachable = Object.values(statuses).some((status) => status !== null);

    console.log(
      JSON.stringify(
        {
          port,
          reachable,
          routes: statuses,
        },
        null,
        2,
      ),
    );
  }

  console.log(
    "[dev-doctor] if several ports respond or 3001 is missing expected routes, stop stale Next processes and relaunch only npm run dev:stable.",
  );
}

main().catch((error) => {
  console.error("[dev-doctor] failed", error);
  process.exitCode = 1;
});
