import { describe, expect, it } from "vitest";

import {
  listAgentApiCapabilities,
  listMissingAgentApiCapabilities,
} from "@/agents/ai-regulation/agentApiCapabilities";

describe("agent API capabilities", () => {
  it("marks no-key public APIs as available", () => {
    const capabilities = listAgentApiCapabilities({});

    expect(capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "gdelt-doc-api",
          status: "available",
          implementedProvider: "gdelt",
        }),
        expect.objectContaining({
          id: "federal-register-api",
          status: "available",
          implementedProvider: "federal_register",
        }),
      ]),
    );
  });

  it("reports missing user credentials for optional implemented APIs", () => {
    const missing = listMissingAgentApiCapabilities({});

    expect(missing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "newsapi",
          status: "missing_credentials",
          envVars: ["NEWSAPI_API_KEY"],
          missingEnvVars: ["NEWSAPI_API_KEY"],
        }),
        expect.objectContaining({
          id: "firecrawl",
          status: "missing_credentials",
          envVars: ["FIRECRAWL_API_KEY"],
          missingEnvVars: ["FIRECRAWL_API_KEY"],
        }),
        expect.objectContaining({
          id: "scrapling-sidecar",
          status: "needs_user_setup",
          envVars: ["SCRAPLING_WORKER_URL"],
          missingEnvVars: ["SCRAPLING_WORKER_URL"],
        }),
        expect.objectContaining({
          id: "legifrance-piste",
          status: "needs_user_setup",
          envVars: ["LEGIFRANCE_PISTE_CLIENT_ID", "LEGIFRANCE_PISTE_CLIENT_SECRET"],
        }),
        expect.objectContaining({
          id: "judilibre-api",
          status: "needs_user_setup",
          envVars: ["JUDILIBRE_API_KEYID"],
        }),
        expect.objectContaining({
          id: "legal-data-hunter",
          status: "needs_user_setup",
          envVars: ["LEGAL_DATA_HUNTER_MCP_URL", "LEGAL_DATA_HUNTER_API_KEY", "LEGAL_RESEARCH_MCP_URL"],
        }),
        expect.objectContaining({
          id: "courtlistener-recap",
          status: "needs_user_setup",
          envVars: ["COURTLISTENER_API_KEY"],
          missingEnvVars: ["COURTLISTENER_API_KEY"],
        }),
      ]),
    );
  });

  it("marks optional APIs available when credentials or MCP endpoints are configured", () => {
    const capabilities = listAgentApiCapabilities({
      NEWSAPI_API_KEY: "news-key",
      LEGIFRANCE_PISTE_CLIENT_ID: "client-id",
      LEGIFRANCE_PISTE_CLIENT_SECRET: "client-secret",
      JUDILIBRE_API_KEYID: "judilibre-key",
      LEGAL_DATA_HUNTER_MCP_URL: "https://legal-data-hunter.example/mcp",
      COURTLISTENER_API_KEY: "courtlistener-key",
      FIRECRAWL_API_KEY: "firecrawl-key",
      SCRAPLING_WORKER_URL: "https://scrapling-worker.example",
    });

    expect(capabilities.find((capability) => capability.id === "newsapi")?.status).toBe(
      "available",
    );
    expect(capabilities.find((capability) => capability.id === "legifrance-piste")?.status).toBe(
      "available",
    );
    expect(capabilities.find((capability) => capability.id === "judilibre-api")?.status).toBe(
      "available",
    );
    expect(capabilities.find((capability) => capability.id === "legal-data-hunter")?.status).toBe(
      "available",
    );
    expect(capabilities.find((capability) => capability.id === "courtlistener-recap")?.status).toBe(
      "available",
    );
    expect(capabilities.find((capability) => capability.id === "firecrawl")?.status).toBe(
      "available",
    );
    expect(capabilities.find((capability) => capability.id === "scrapling-sidecar")?.status).toBe(
      "available",
    );
    expect(
      capabilities.find((capability) => capability.id === "courtlistener-recap")
        ?.configuredEnvVars,
    ).toEqual(["COURTLISTENER_API_KEY"]);
  });

  it("documents legal research accelerators as preferred over generic scraping", () => {
    expect(listAgentApiCapabilities({})).toContainEqual(
      expect.objectContaining({
        id: "courtlistener-recap",
        status: "needs_user_setup",
        envVars: ["COURTLISTENER_API_KEY"],
        notes: expect.stringContaining("Preferred over generic scraping"),
      }),
    );
    expect(listAgentApiCapabilities({})).toContainEqual(
      expect.objectContaining({
        id: "legal-data-hunter",
        status: "needs_user_setup",
        notes: expect.stringContaining("Preferred over generic scraping"),
      }),
    );
  });
});
