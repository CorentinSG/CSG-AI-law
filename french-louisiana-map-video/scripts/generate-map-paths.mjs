/**
 * Generates SVG path strings for the map from Natural Earth world-atlas data.
 * Outputs assets/map-paths.json with projected path strings for USA, Canada,
 * Mexico, land masses, and graticule lines.
 *
 * Projection: Mercator centered on eastern North America, 1080x1920 canvas.
 */

import { geoMercator, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const WIDTH = 1080;
const HEIGHT = 1920;

// Load world atlas (50m = better detail than 110m)
const world = JSON.parse(readFileSync('./node_modules/world-atlas/countries-50m.json', 'utf8'));
const countries = feature(world, world.objects.countries);
const land = feature(world, world.objects.land);

// Country IDs in Natural Earth / world-atlas (numeric ISO 3166-1)
const USA_ID    = '840';
const CANADA_ID = '124';
const MEXICO_ID = '484';
const CUBA_ID   = '192';

const usa    = countries.features.find(f => f.id === USA_ID);
const canada = countries.features.find(f => f.id === CANADA_ID);
const mexico = countries.features.find(f => f.id === MEXICO_ID);
const cuba   = countries.features.find(f => f.id === CUBA_ID);

// --- Projection ---
// Centered on eastern North America, portrait 1080x1920.
// Shows roughly lon -105 to -50, lat 25 to 63.
const projection = geoMercator()
  .scale(1700)
  .center([-78, 43.5])
  .translate([WIDTH / 2, HEIGHT / 2]);

const path = geoPath().projection(projection);

// --- Graticule ---
const graticuleGen = geoGraticule().step([10, 10]);
const graticule = path(graticuleGen());

// --- Paths ---
const paths = {
  usa:       usa    ? path(usa)    : '',
  canada:    canada ? path(canada) : '',
  mexico:    mexico ? path(mexico) : '',
  cuba:      cuba   ? path(cuba)   : '',
  land:      path(land),
  graticule,
};

// --- Key points projected (for annotation positions) ---
const points = {
  // [lon, lat] → [x, y]
  quebecCity:   projection([-71.2, 46.8]),
  montreal:     projection([-73.6, 45.5]),
  halifax:      projection([-63.6, 44.7]),   // Acadia capital
  acadiaCenter: projection([-65.0, 45.8]),   // approx centre of Acadia region
  newOrleans:   projection([-90.1, 30.0]),
  mobile:       projection([-88.0, 30.7]),
  biloxi:       projection([-88.9, 30.4]),
  portRoyal:    projection([-65.7, 44.7]),   // Port Royal, Acadia
  // Mississippi river mouth
  msDelta:      projection([-89.1, 29.1]),
  // Great Lakes reference
  lakeOntario:  projection([-77.7, 43.7]),
  toronto:      projection([-79.4, 43.7]),
};

// --- Output ---
mkdirSync('./assets', { recursive: true });
writeFileSync('./assets/map-paths.json', JSON.stringify({ paths, points }, null, 0));

// Human-readable summary
Object.entries(points).forEach(([name, [x, y]]) => {
  console.log(`${name.padEnd(16)}: x=${Math.round(x)}, y=${Math.round(y)}`);
});
console.log('\n✓ Written to assets/map-paths.json');
