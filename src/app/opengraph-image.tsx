import { ImageResponse } from "next/og";

// Branded default social card for the whole site. File-based metadata takes
// priority over the `metadata` object, so this survives the per-page
// `openGraph` blocks that would otherwise replace a root-level `images` entry
// (Next merges `openGraph` shallowly — a page redefining it drops the parent's
// fields). No request-time API is used, so it is generated once at build time.
export const alt = "C. Saint-Girons, Esq - AI Law & Legal Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 22% 12%, rgba(196,136,42,0.22), transparent 55%)",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "9999px",
              backgroundColor: "#c4882a",
            }}
          />
          <div
            style={{
              fontSize: "24px",
              letterSpacing: "8px",
              textTransform: "uppercase",
              color: "#c4882a",
            }}
          >
            AI Law &amp; Legal Intelligence
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              fontSize: "84px",
              lineHeight: 1.05,
              letterSpacing: "-3px",
              color: "#ffffff",
            }}
          >
            C. Saint-Girons, Esq
          </div>
          <div
            style={{
              fontSize: "32px",
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.72)",
              maxWidth: "900px",
            }}
          >
            Attorney-led AI regulation monitoring, structured legal research,
            and source-verified regulatory analysis.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "28px",
            fontSize: "22px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          AI Regulation Monitor · Europe · United States · International
        </div>
      </div>
    ),
    size,
  );
}
