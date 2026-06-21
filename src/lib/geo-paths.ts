import { readFileSync } from "fs";
import { join } from "path";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

// d3-geo v2 ships without bundled TypeScript declarations; use require + cast.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const d3 = require("d3-geo") as Record<string, (...a: any[]) => any>;

export interface GeoPathData {
  id: string;
  d: string;
}

function computePaths(
  topoFile: string,
  objectName: string,
  projectionFn: () => unknown,
): GeoPathData[] {
  const raw = readFileSync(join(process.cwd(), "public", "geo", topoFile), "utf-8");
  const topology = JSON.parse(raw) as Topology;
  const projection = projectionFn();
  const pathFn = d3.geoPath(projection) as (f: unknown) => string | null;
  const geojson = feature(topology, topology.objects[objectName] as GeometryCollection);
  return geojson.features
    .map((f) => ({ id: String(f.id ?? ""), d: pathFn(f) ?? "" }))
    .filter((p) => p.d.length > 0);
}

// Module-level caches — computed once per process (ISR-safe in production, hot-reload-safe in dev)
let europeCache: GeoPathData[] | null = null;
let usCache: GeoPathData[] | null = null;

export function getEuropeGeoPaths(): GeoPathData[] {
  europeCache ??= computePaths("countries-50m.json", "countries", () =>
    d3.geoMercator().center([14, 53]).scale(600).translate([390, 260]),
  );
  return europeCache;
}

export function getUsGeoPaths(): GeoPathData[] {
  usCache ??= computePaths("states-10m.json", "states", () =>
    d3.geoAlbersUsa().scale(900).translate([480, 300]),
  );
  return usCache;
}
