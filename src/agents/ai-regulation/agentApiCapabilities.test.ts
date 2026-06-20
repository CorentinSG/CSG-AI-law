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
      ]),
    );
  });

  it("marks optional implemented APIs available when credentials are configured", () => {
    const capabilities = listAgentApiCapabilities({
      NEWSAPI_API_KEY: "news-key",
      LEGIFRANCE_PISTE_CLIENT_ID: "client-id",
      LEGIFRANCE_PISTE_CLIENT_SECRET: "client-secret",
      JUDILIBRE_API_KEYID: "judilibre-key",
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
  });

  it("keeps unimplemented future APIs clearly planned", () => {
    expect(listAgentApiCapabilities({})).toContainEqual(
      expect.objectContaining({
        id: "courtlistener-recap",
        status: "planned",
        envVars: ["COURTLISTENER_API_KEY"],
      }),
    );
  });
});
