import { describe, expect, it } from "vitest";

import {
  inferDevelopmentType,
  inferImportanceLevel,
  inferJurisdiction,
  inferLegalArea,
} from "@/agents/ai-regulation/utils/classification";

describe("classification helpers", () => {
  it("infers development type from text", () => {
    expect(inferDevelopmentType("Executive order on AI exports")).toBe(
      "Executive order",
    );
  });

  it("infers legal area from text", () => {
    expect(inferLegalArea("Data protection guidance for AI systems")).toBe(
      "Data protection",
    );
  });

  it("infers labor and social law from workplace AI signals", () => {
    expect(
      inferLegalArea("Algorithmic management and workplace AI rules for platform workers"),
    ).toBe("Labor and social law");
  });

  it("infers jurisdiction from source context", () => {
    expect(inferJurisdiction("CNIL AI", "Official France AI guidance")).toBe(
      "France",
    );
  });

  it("infers importance from strong regulatory signals", () => {
    expect(
      inferImportanceLevel("Binding law enters into force with major enforcement"),
    ).toBe("critical");
  });
});
