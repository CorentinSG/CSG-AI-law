import { readFileSync } from "fs";
import { join } from "path";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  geoPath,
  geoMercator,
  geoAlbersUsa,
  type GeoProjection,
} from "d3-geo";

export interface GeoPathData {
  id: string;
  d: string;
}

function computePaths(
  topoFile: string,
  objectName: string,
  projectionFn: () => GeoProjection,
): GeoPathData[] {
  const raw = readFileSync(join(process.cwd(), "public", "geo", topoFile), "utf-8");
  const topology = JSON.parse(raw) as Topology;
  const pathFn = geoPath(projectionFn());
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
    geoMercator().center([14, 53]).scale(600).translate([390, 260]),
  );
  return europeCache;
}

export function getUsGeoPaths(): GeoPathData[] {
  usCache ??= computePaths("states-10m.json", "states", () =>
    geoAlbersUsa().scale(900).translate([480, 300]),
  );
  return usCache;
}
