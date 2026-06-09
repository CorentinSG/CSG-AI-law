/**
 * Reads the generated map-paths.json and writes the complete index.html
 * with all SVG paths inlined — fully synchronous rendering for HyperFrames.
 */

import { readFileSync, writeFileSync } from 'fs';
import { geoMercator, geoPath } from 'd3-geo';

const { paths, points } = JSON.parse(readFileSync('./assets/map-paths.json', 'utf8'));

// Short aliases for key coordinates
const QC  = points.quebecCity;     // Quebec City
const MON = points.montreal;       // Montreal
const HAL = points.halifax;        // Halifax
const ACA = points.acadiaCenter;   // Acadia center
const NO  = points.newOrleans;     // New Orleans
const MOB = points.mobile;
const LON = points.lakeOntario;

// ── Helper: generate an SVG cubic-bezier path between two points
// via intermediate control points (for natural-looking migration arrow)
function curvePath(pts) {
  // pts = [[x,y], ...]
  if (pts.length < 2) return '';
  const parts = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const mx = (prev[0] + curr[0]) / 2;
    // slight east-bow for coastal routes, west-bow for interior
    const bow = pts[0][0] > 500 ? -60 : 60;
    parts.push(`Q ${(mx + bow).toFixed(1)} ${((prev[1] + curr[1]) / 2).toFixed(1)} ${curr[0].toFixed(1)} ${curr[1].toFixed(1)}`);
  }
  return parts.join(' ');
}

// ── Arrow 1: La Salle route — Quebec → Great Lakes → Mississippi → Louisiana (1682)
const arrow1Path = curvePath([
  [MON[0], MON[1]],
  [LON[0], LON[1]],          // Lake Ontario
  [460, 1020],               // Ohio / upper Mississippi
  [320, 1180],               // Mid Mississippi
  [230, 1340],               // Lower Mississippi
  [NO[0] + 15, NO[1] - 20], // New Orleans
]);

// ── Arrow 2: Acadian exile — Acadia → south along coast → Gulf → Louisiana (1755+)
const arrow2Path = curvePath([
  [ACA[0], ACA[1] + 30],
  [920,  1050],
  [850,  1180],
  [780,  1290],
  [680,  1380],
  [500,  1430],
  [NO[0] + 20, NO[1]],
]);

// ── Approximate region polygons (using projected coordinates)
// Quebec region — rough polygon covering southern Quebec province
const quebecPoly = [
  [-80, 46.8], [-74, 46.5], [-70, 47.5], [-64.5, 48.0],
  [-61, 47.2], [-60, 48.5], [-64, 50.5], [-72, 50.0],
  [-78, 48.5], [-80, 47.5],
].map(([lon, lat]) => {
  const proj = geoMercator().scale(1700).center([-78, 43.5]).translate([540, 960]);
  return proj([lon, lat]);
});
const quebecPolyStr = quebecPoly.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// Acadia region — Nova Scotia + New Brunswick
const acadiaPoly = [
  [-67.0, 47.0], [-64.5, 47.5], [-62.0, 47.2], [-60.0, 46.0],
  [-59.5, 45.0], [-61.0, 43.5], [-64.5, 43.5], [-66.5, 44.0],
  [-67.5, 45.5],
].map(([lon, lat]) => {
  const proj = geoMercator().scale(1700).center([-78, 43.5]).translate([540, 960]);
  return proj([lon, lat]);
});
const acadiaPolyStr = acadiaPoly.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// Louisiana region — approximate
const louisianaPoly = [
  [-94.0, 33.0], [-89.5, 33.0], [-89.0, 35.0], [-91.5, 33.5],
  [-91.5, 31.0], [-89.0, 28.8], [-88.5, 30.3], [-90.5, 29.0],
  [-94.0, 30.0],
].map(([lon, lat]) => {
  const proj = geoMercator().scale(1700).center([-78, 43.5]).translate([540, 960]);
  return proj([lon, lat]);
});
const louisianaPolyStr = louisianaPoly.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// ── Compute approximate path lengths for dash animation
function approxPathLen(dAttr) {
  // Very rough approximation: count coordinate pairs and estimate distance
  // For animation purposes, we'll use a generous over-estimate
  const segs = dAttr.split(/[MLQCZz]/).filter(Boolean);
  return segs.length * 80 + 400;
}
const arrow1Len = approxPathLen(arrow1Path) + 200;
const arrow2Len = approxPathLen(arrow2Path) + 200;

// ── Mississippi River path (real coordinates projected)
const msRiverPoints = [
  [-95.1, 49.0], [-93.5, 47.5], [-92.0, 46.5], [-91.5, 45.5],
  [-91.0, 44.0], [-91.3, 43.0], [-91.2, 41.5], [-90.5, 40.5],
  [-90.0, 38.5], [-89.5, 37.0], [-89.3, 36.0], [-89.1, 35.0],
  [-89.2, 34.0], [-90.5, 32.5], [-91.5, 31.5], [-91.2, 30.5],
  [-90.1, 29.9],
].map(([lon, lat]) => {
  const proj = geoMercator().scale(1700).center([-78, 43.5]).translate([540, 960]);
  return proj([lon, lat]);
});
const msRiverPath = 'M ' + msRiverPoints.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');

// ── Atlantic coast label positions (mid-ocean)
const proj = geoMercator().scale(1700).center([-78, 43.5]).translate([540, 960]);
const atlanticLabel = proj([-55, 42]);
const gulfLabel = proj([-90, 27]);

// ── Build the HTML ──────────────────────────────────────────────────────────────
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body {
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #c4b48a;
      }
      body { font-family: "Georgia", "Times New Roman", serif; }

      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: radial-gradient(ellipse at 45% 35%, #d5c79e 0%, #bfa876 55%, #a48a52 100%);
      }

      /* Subtle paper texture */
      #root::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100,75,30,.04) 3px, rgba(100,75,30,.04) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(100,75,30,.03) 3px, rgba(100,75,30,.03) 4px);
        pointer-events: none;
        z-index: 0;
      }

      /* Decorative border */
      .border-outer {
        position: absolute;
        inset: 22px;
        border: 4px solid #6b4e20;
        pointer-events: none;
        z-index: 200;
      }
      .border-outer::before {
        content: "";
        position: absolute;
        inset: 7px;
        border: 1.5px solid rgba(107,78,32,.45);
      }

      /* Map SVG */
      #map {
        position: absolute;
        inset: 0;
        z-index: 1;
      }

      /* Text panels */
      .panel {
        position: absolute;
        left: 52px;
        right: 52px;
        padding: 26px 34px;
        background: rgba(196,162,94,.92);
        border: 2px solid #6b4e20;
        border-radius: 4px;
        z-index: 30;
      }
      .panel.bottom { bottom: 76px; }
      .panel.top    { top: 76px; }

      .panel-title {
        font-size: 46px;
        font-weight: 700;
        color: #1e0e00;
        line-height: 1.2;
        text-align: center;
      }
      .panel-sub {
        font-size: 24px;
        color: #3e2200;
        font-style: italic;
        text-align: center;
        margin-top: 10px;
        line-height: 1.35;
      }
      .panel-caption {
        font-size: 21px;
        color: #5a3800;
        text-align: center;
        margin-top: 8px;
        font-style: italic;
        opacity: .85;
      }

      /* Dark overlay cards */
      .card {
        position: absolute;
        left: 56px;
        right: 56px;
        background: rgba(20,10,0,.86);
        border: 3px solid #c8a444;
        border-radius: 6px;
        padding: 56px 48px;
        text-align: center;
        z-index: 31;
      }
      .card-title  { font-size: 66px; font-weight:700; color:#f0d898; line-height:1.15; letter-spacing:1px; }
      .card-sub    { font-size: 34px; color:#c8a444; margin-top:22px; font-style:italic; }
      .card-sig    { font-size: 20px; color:#7a6030; margin-top:28px; letter-spacing:3px; text-transform:uppercase; }

      /* Map labels */
      .lbl {
        position: absolute;
        font-family: "Georgia", serif;
        font-weight: 700;
        color: #18304a;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-shadow: 1px 1px 0 rgba(196,162,94,.8), -1px -1px 0 rgba(196,162,94,.8);
        pointer-events: none;
        z-index: 40;
        white-space: nowrap;
      }
      .lbl.danger { color: #8b0000; }
      .lbl.gold   { color: #7a4800; }
      .lbl.sm     { font-size: 20px; letter-spacing:1px; }
      .lbl.md     { font-size: 26px; }
      .lbl.lg     { font-size: 32px; }

      /* Legend */
      .legend {
        position: absolute;
        bottom: 136px;
        left: 56px;
        background: rgba(196,162,94,.9);
        border: 1.5px solid #6b4e20;
        border-radius: 4px;
        padding: 14px 18px;
        z-index: 50;
      }
      .legend-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 7px;
        font-size: 20px;
        color: #1e0e00;
      }
      .swatch { width:26px; height:13px; border-radius:2px; flex-shrink:0; }

      /* Progress bar */
      .prog-wrap {
        position: absolute;
        bottom: 44px;
        left: 56px;
        right: 56px;
        height: 5px;
        background: rgba(107,78,32,.25);
        border-radius: 3px;
        z-index: 200;
        overflow: hidden;
      }
      .prog-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #c8a444, #e8c860);
        border-radius: 3px;
      }

      /* Year badge */
      .year-badge {
        position: absolute;
        background: rgba(20,10,0,.82);
        border: 2px solid #c8a444;
        border-radius: 4px;
        padding: 6px 18px;
        font-size: 28px;
        font-weight: 700;
        color: #f0d898;
        letter-spacing: 2px;
        z-index: 45;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="34"
      data-width="1080"
      data-height="1920"
    >
      <div class="border-outer"></div>

      <!-- Progress bar -->
      <div class="prog-wrap">
        <div class="prog-fill" id="prog"></div>
      </div>

      <!-- ═══════════════════════════════════════════════
           REAL MAP SVG (Natural Earth / world-atlas 50m)
           ═══════════════════════════════════════════ -->
      <svg id="map" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"
           style="opacity:0;">

        <!-- Ocean -->
        <rect width="1080" height="1920" fill="#8fb5d0"/>

        <!-- Graticule (grid lines) -->
        <path d="${paths.graticule}"
          fill="none" stroke="#5a7a96" stroke-width="0.6" opacity="0.35"/>

        <!-- Land background -->
        <path d="${paths.land}"
          fill="#d8cba8" stroke="#9a8060" stroke-width="0.5"/>

        <!-- Country fills -->
        <path id="usa-path"   d="${paths.usa}"    fill="#ddd0b0" stroke="#8a7050" stroke-width="1"/>
        <path id="canada-path" d="${paths.canada}" fill="#d4c7a0" stroke="#8a7050" stroke-width="1"/>
        <path id="mexico-path" d="${paths.mexico}" fill="#d0c49c" stroke="#8a7050" stroke-width="0.8"/>
        ${paths.cuba ? `<path d="${paths.cuba}" fill="#d0c49c" stroke="#8a7050" stroke-width="0.8"/>` : ''}

        <!-- Mississippi River -->
        <path id="ms-river"
          d="${msRiverPath}"
          fill="none" stroke="#6a9ab0" stroke-width="8" stroke-linecap="round"
          stroke-linejoin="round" opacity="0.65"/>

        <!-- Ocean labels -->
        <text x="${atlanticLabel[0].toFixed(0)}" y="${atlanticLabel[1].toFixed(0)}"
          fill="#2a4a6a" font-size="28" font-family="Georgia,serif" font-style="italic"
          opacity="0.5" text-anchor="middle" transform="rotate(-25,${atlanticLabel[0].toFixed(0)},${atlanticLabel[1].toFixed(0)})">
          ATLANTIQUE
        </text>
        <text x="${gulfLabel[0].toFixed(0)}" y="${gulfLabel[1].toFixed(0)}"
          fill="#2a4a6a" font-size="26" font-family="Georgia,serif" font-style="italic"
          opacity="0.5" text-anchor="middle">
          Golfe du Mexique
        </text>
        <text x="${(LON[0] - 80).toFixed(0)}" y="${(LON[1] + 15).toFixed(0)}"
          fill="#2a4a6a" font-size="18" font-family="Georgia,serif" font-style="italic"
          opacity="0.5" text-anchor="middle">
          Grands Lacs
        </text>

        <!-- ── REGION HIGHLIGHTS ── -->

        <!-- Quebec region -->
        <polygon id="qc-hl"
          points="${quebecPolyStr}"
          fill="#1a3a6e" opacity="0"/>

        <!-- Acadia region -->
        <polygon id="ac-hl"
          points="${acadiaPolyStr}"
          fill="#1a3a6e" opacity="0"/>

        <!-- Acadia DANGER (expulsion) -->
        <polygon id="ac-danger"
          points="${acadiaPolyStr}"
          fill="#8b0000" opacity="0"/>

        <!-- Louisiana region -->
        <polygon id="la-hl"
          points="${louisianaPolyStr}"
          fill="#1a3a6e" opacity="0"/>

        <!-- ── CITY DOTS ── -->

        <!-- Quebec City -->
        <g id="dot-qc" opacity="0">
          <circle cx="${QC[0].toFixed(1)}" cy="${QC[1].toFixed(1)}" r="13" fill="#1a3a6e" stroke="#f0d898" stroke-width="2.5"/>
          <circle cx="${QC[0].toFixed(1)}" cy="${QC[1].toFixed(1)}" r="5" fill="#f0d898"/>
        </g>

        <!-- Acadia / Halifax -->
        <g id="dot-ac" opacity="0">
          <circle cx="${ACA[0].toFixed(1)}" cy="${ACA[1].toFixed(1)}" r="13" fill="#1a3a6e" stroke="#f0d898" stroke-width="2.5"/>
          <circle cx="${ACA[0].toFixed(1)}" cy="${ACA[1].toFixed(1)}" r="5" fill="#f0d898"/>
        </g>

        <!-- New Orleans -->
        <g id="dot-no" opacity="0">
          <circle cx="${NO[0].toFixed(1)}" cy="${NO[1].toFixed(1)}" r="15" fill="#c8a444" stroke="#1e0e00" stroke-width="2.5"/>
          <circle cx="${NO[0].toFixed(1)}" cy="${NO[1].toFixed(1)}" r="6" fill="#1e0e00"/>
        </g>

        <!-- ── MIGRATION ARROWS ── -->

        <!-- Arrow 1: La Salle — Quebec → Mississippi → Louisiana (gold) -->
        <g id="arrow-lasalle" opacity="0">
          <path id="a1-path"
            d="${arrow1Path}"
            fill="none" stroke="#c8a020" stroke-width="11" stroke-linecap="round"
            stroke-dasharray="30 18"
            stroke-dashoffset="${arrow1Len}"/>
          <polygon id="a1-head"
            points="0,-16 13,9 -13,9" fill="#c8a020"
            transform="translate(${(NO[0]+14).toFixed(1)},${(NO[1]-18).toFixed(1)}) rotate(160)"
            opacity="0"/>
        </g>

        <!-- Arrow 2: Acadian exile — Acadia → Gulf coast → Louisiana (red) -->
        <g id="arrow-acadie" opacity="0">
          <path id="a2-path"
            d="${arrow2Path}"
            fill="none" stroke="#8b0000" stroke-width="11" stroke-linecap="round"
            stroke-dasharray="30 18"
            stroke-dashoffset="${arrow2Len}"/>
          <polygon id="a2-head"
            points="0,-16 13,9 -13,9" fill="#8b0000"
            transform="translate(${(NO[0]+20).toFixed(1)},${(NO[1]+2).toFixed(1)}) rotate(160)"
            opacity="0"/>
        </g>

      </svg>

      <!-- ═══════════════════════════ MAP LABELS ═══════════════════════════ -->

      <div id="lbl-nf" class="clip lbl lg"
           data-start="4" data-duration="30" data-track-index="5"
           style="left:${(QC[0]-220).toFixed(0)}px; top:${(QC[1]-80).toFixed(0)}px; opacity:0; font-size:28px; color:#1a3a6e;">
        NOUVELLE-FRANCE
      </div>
      <div id="lbl-qc" class="clip lbl md"
           data-start="4" data-duration="30" data-track-index="6"
           style="left:${(QC[0]-10).toFixed(0)}px; top:${(QC[1]+18).toFixed(0)}px; opacity:0;">
        QUÉBEC
      </div>
      <div id="lbl-ac" class="clip lbl md"
           data-start="4" data-duration="30" data-track-index="7"
           style="left:${(ACA[0]-60).toFixed(0)}px; top:${(ACA[1]+18).toFixed(0)}px; opacity:0;">
        ACADIE
      </div>
      <div id="lbl-la" class="clip lbl lg"
           data-start="12" data-duration="22" data-track-index="8"
           style="left:${(NO[0]-10).toFixed(0)}px; top:${(NO[1]-65).toFixed(0)}px; color:#7a4800; font-size:28px; opacity:0;">
        LOUISIANE
      </div>
      <div id="lbl-no" class="clip lbl sm"
           data-start="12" data-duration="22" data-track-index="9"
           style="left:${(NO[0]+18).toFixed(0)}px; top:${(NO[1]+18).toFixed(0)}px; color:#7a4800; opacity:0;">
        La Nouvelle-Orléans
      </div>

      <!-- Year badge -->
      <div id="year-1682" class="clip year-badge"
           data-start="9" data-duration="6" data-track-index="45"
           style="left:${(NO[0]+50).toFixed(0)}px; top:${(NO[1]+60).toFixed(0)}px; opacity:0;">
        1682
      </div>
      <div id="year-1718" class="clip year-badge"
           data-start="14" data-duration="5" data-track-index="46"
           style="left:${(NO[0]+50).toFixed(0)}px; top:${(NO[1]+60).toFixed(0)}px; opacity:0; font-size:24px;">
        N.-Orléans, 1718
      </div>
      <div id="year-1755" class="clip year-badge"
           data-start="19" data-duration="7" data-track-index="47"
           style="left:${(ACA[0]-160).toFixed(0)}px; top:${(ACA[1]-55).toFixed(0)}px; opacity:0; border-color:#8b0000; color:#ffcc88;">
        1755 — EXPULSION
      </div>

      <!-- ═══════════════ SCENE 1 — Title (0–4s) ═══════════════ -->
      <div id="s1" class="clip"
           data-start="0" data-duration="4" data-track-index="20"
           style="position:absolute;inset:0;z-index:20;opacity:0;">
        <div class="card" style="top:50%;transform:translateY(-50%);">
          <div class="card-title">Comment les Français sont-ils arrivés en Louisiane&nbsp;?</div>
          <div class="card-sub">De la Nouvelle-France à la Louisiane</div>
        </div>
      </div>

      <!-- ═══════════════ SCENE 2 — Nouvelle-France établie (4–9s) ═══════════════ -->
      <div id="s2" class="clip panel bottom"
           data-start="4" data-duration="5" data-track-index="20"
           style="opacity:0;">
        <div class="panel-title">La France s'installe en Amérique du Nord</div>
        <div class="panel-sub">Québec (1608) &amp; Acadie (1604)</div>
        <div class="panel-caption">Deux grandes colonies françaises au nord du continent</div>
      </div>

      <!-- ═══════════════ SCENE 3 — La Salle / Louisiana claim (9–15s) ═══════════════ -->
      <div id="s3" class="clip panel bottom"
           data-start="9" data-duration="6" data-track-index="20"
           style="opacity:0;">
        <div class="panel-title">La Salle descend le Mississippi</div>
        <div class="panel-sub">Il prend possession de la Louisiane (1682)</div>
        <div class="panel-caption">La Nouvelle-Orléans est fondée en 1718</div>
      </div>

      <!-- ═══════════════ SCENE 4 — Le Grand Dérangement (15–24s) ═══════════════ -->
      <div id="s4" class="clip panel bottom"
           data-start="15" data-duration="9" data-track-index="20"
           style="opacity:0;">
        <div class="panel-title">Le Grand Dérangement (1755–1763)</div>
        <div class="panel-sub">Les Britanniques expulsent les Acadiens</div>
        <div class="panel-caption">Plus de 10 000 Acadiens chassés rejoignent la Louisiane française déjà établie</div>
      </div>

      <!-- ═══════════════ SCENE 5 — Deux histoires (24–30s) ═══════════════ -->
      <div id="s5" class="clip panel top"
           data-start="24" data-duration="6" data-track-index="20"
           style="opacity:0;">
        <div class="panel-title">Deux histoires françaises se rejoignent</div>
        <div class="panel-sub">Les Acadiens rejoignent la Louisiane française</div>
        <div class="panel-caption">Naissance de la culture cajun</div>
      </div>

      <!-- ═══════════════ SCENE 6 — End (30–34s) ═══════════════ -->
      <div id="s6" class="clip"
           data-start="30" data-duration="4" data-track-index="20"
           style="position:absolute;inset:0;z-index:20;opacity:0;">
        <div class="card" style="top:50%;transform:translateY(-50%);">
          <div class="card-title">La Louisiane française : un héritage à deux voix</div>
          <div class="card-sub">Québec, Acadie &amp; Nouvelle-Orléans</div>
          <div class="card-sig">Carte historique animée</div>
        </div>
      </div>

      <!-- ═══════════════ LEGEND (4–30s) ═══════════════ -->
      <div id="legend" class="clip legend"
           data-start="4" data-duration="26" data-track-index="15"
           style="opacity:0;">
        <div class="legend-row">
          <div class="swatch" style="background:#1a3a6e;"></div>
          Territoire français
        </div>
        <div class="legend-row">
          <div class="swatch" style="background:#c8a020;"></div>
          Route de La Salle (1682)
        </div>
        <div class="legend-row">
          <div class="swatch" style="background:#8b0000;"></div>
          Exil acadien (1755+)
        </div>
      </div>

    </div><!-- #root -->

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // Progress bar
      tl.to("#prog", { width: "100%", duration: 34, ease: "none" }, 0);

      // ════ SCENE 1 — Title (0–4s) ════
      tl.to("#s1", { opacity: 1, duration: 0.7, ease: "power2.out" }, 0);
      tl.to("#s1", { opacity: 0, duration: 0.5 }, 3.5);
      tl.set("#s1", { opacity: 0 }, 4.0);

      // Map fades in
      tl.to("#map", { opacity: 1, duration: 1.2, ease: "power2.out" }, 1.0);

      // ════ SCENE 2 — Nouvelle-France (4–9s) ════
      tl.to("#s2",     { opacity: 1, duration: 0.5 }, 4.2);
      tl.to("#s2",     { opacity: 0, duration: 0.4 }, 8.8);
      tl.set("#s2",    { opacity: 0 }, 9.0);
      tl.to("#legend", { opacity: 1, duration: 0.5 }, 4.5);

      // Quebec highlight + dot + label
      tl.to("#qc-hl",  { opacity: 0.45, duration: 0.9 }, 4.3);
      tl.fromTo("#dot-qc",
        { opacity:0, scale:0, transformOrigin:"${QC[0].toFixed(1)}px ${QC[1].toFixed(1)}px" },
        { opacity:1, scale:1, duration:0.5, ease:"back.out(2)" }, 4.7);
      tl.to("#lbl-nf", { opacity: 1, duration: 0.5 }, 5.0);
      tl.to("#lbl-qc", { opacity: 1, duration: 0.5 }, 5.3);

      // Acadia highlight + dot + label
      tl.to("#ac-hl",  { opacity: 0.45, duration: 0.9 }, 5.5);
      tl.fromTo("#dot-ac",
        { opacity:0, scale:0, transformOrigin:"${ACA[0].toFixed(1)}px ${ACA[1].toFixed(1)}px" },
        { opacity:1, scale:1, duration:0.5, ease:"back.out(2)" }, 5.8);
      tl.to("#lbl-ac", { opacity: 1, duration: 0.5 }, 6.1);

      // ════ SCENE 3 — La Salle (9–15s) ════
      tl.to("#s3", { opacity: 1, duration: 0.5 }, 9.2);
      tl.to("#s3", { opacity: 0, duration: 0.4 }, 14.6);
      tl.set("#s3", { opacity: 0 }, 15.0);

      // Mississippi river pulsing
      tl.to("#ms-river", { opacity: 0.9, duration: 0.8, overwrite:"auto" }, 9.5);
      tl.to("#ms-river", { opacity: 0.5, duration: 0.8, overwrite:"auto" }, 10.3);
      tl.to("#ms-river", { opacity: 0.85, duration: 0.8, overwrite:"auto" }, 11.1);
      tl.to("#ms-river", { opacity: 0.6, duration: 0.8, overwrite:"auto" }, 11.9);

      // La Salle arrow draws
      tl.to("#arrow-lasalle", { opacity: 1, duration: 0.3 }, 9.5);
      tl.to("#a1-path", { strokeDashoffset: 0, duration: 3.8, ease: "power1.inOut" }, 9.5);
      tl.to("#a1-head", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)",
                          transformOrigin: "${(NO[0]+14).toFixed(1)}px ${(NO[1]-18).toFixed(1)}px" }, 13.3);

      // Louisiana highlight appears
      tl.to("#la-hl", { opacity: 0.45, duration: 0.8 }, 12.5);
      tl.fromTo("#dot-no",
        { opacity:0, scale:0, transformOrigin:"${NO[0].toFixed(1)}px ${NO[1].toFixed(1)}px" },
        { opacity:1, scale:1, duration:0.5, ease:"back.out(2)" }, 12.8);
      tl.to("#lbl-la", { opacity: 1, duration: 0.5 }, 13.0);
      tl.to("#lbl-no", { opacity: 1, duration: 0.5 }, 13.3);
      tl.to("#year-1682", { opacity: 1, duration: 0.4 }, 12.0);
      tl.to("#year-1718", { opacity: 1, duration: 0.4 }, 14.0);

      // ════ SCENE 4 — Grand Dérangement (15–24s) ════
      tl.to("#s4", { opacity: 1, duration: 0.5 }, 15.2);
      tl.to("#s4", { opacity: 0, duration: 0.4 }, 23.6);
      tl.set("#s4", { opacity: 0 }, 24.0);

      // Acadia turns red (danger) — normal highlight fades, danger fades in
      tl.to("#ac-hl",     { opacity: 0, duration: 0.8 }, 15.5);
      tl.to("#ac-danger", { opacity: 0.6, duration: 0.8 }, 15.5);
      // Pulse the danger
      tl.to("#ac-danger", { opacity: 0.3, duration: 0.8, ease: "sine.inOut", overwrite:"auto" }, 16.3);
      tl.to("#ac-danger", { opacity: 0.6, duration: 0.8, ease: "sine.inOut", overwrite:"auto" }, 17.1);
      tl.to("#ac-danger", { opacity: 0.3, duration: 0.8, ease: "sine.inOut", overwrite:"auto" }, 17.9);
      tl.to("#ac-danger", { opacity: 0.5, duration: 0.8, ease: "sine.inOut", overwrite:"auto" }, 18.7);

      tl.to("#year-1755", { opacity: 1, duration: 0.4 }, 15.8);

      // Acadian exile arrow draws (red)
      tl.to("#arrow-acadie", { opacity: 1, duration: 0.3 }, 17.0);
      tl.to("#a2-path", { strokeDashoffset: 0, duration: 4.5, ease: "power1.inOut" }, 17.0);
      tl.to("#a2-head", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)",
                          transformOrigin: "${(NO[0]+20).toFixed(1)}px ${NO[1].toFixed(1)}px" }, 21.5);

      // Louisiana pulses gold when Acadians arrive
      tl.to("#la-hl", { opacity: 0.65, duration: 0.8, ease: "power2.in", overwrite:"auto" }, 21.8);
      tl.to("#la-hl", { opacity: 0.35, duration: 0.8, ease: "sine.inOut", overwrite:"auto" }, 22.6);
      tl.to("#la-hl", { opacity: 0.65, duration: 0.8, ease: "sine.inOut", overwrite:"auto" }, 23.4);

      // ════ SCENE 5 — Zoom Louisiana + two histories (24–30s) ════
      tl.to("#s5", { opacity: 1, duration: 0.5 }, 24.2);
      tl.to("#s5", { opacity: 0, duration: 0.4 }, 29.6);
      tl.set("#s5", { opacity: 0 }, 30.0);

      // Camera zoom toward Louisiana
      tl.to("#map", {
        scale: 1.4,
        transformOrigin: "${(NO[0]/1080*100).toFixed(1)}% ${(NO[1]/1920*100).toFixed(1)}%",
        duration: 3.5,
        ease: "power2.inOut"
      }, 24.0);

      // ════ SCENE 6 — End (30–34s) ════
      tl.to("#map",   { scale: 1, transformOrigin:"50% 50%", duration:1.5, ease:"power2.inOut" }, 29.0);
      tl.to("#map",   { opacity: 0.3, duration: 1.0 }, 30.0);
      tl.to("#legend",{ opacity: 0, duration: 0.5 }, 30.0);
      tl.to("#s6", { opacity: 1, duration: 0.8, ease: "power2.out" }, 30.3);

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>`;

writeFileSync('./index.html', html, 'utf8');
console.log(`✓ index.html written (${(html.length / 1024).toFixed(1)} KB)`);
