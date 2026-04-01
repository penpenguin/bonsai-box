const PRESETS = [
  { key: "straight", label: "直幹" },
  { key: "slant", label: "斜幹" },
  { key: "windswept", label: "吹き流し" },
  { key: "semiCascade", label: "半懸崖" },
];

const SOIL_TOP = 1.15;

export function listPresets() {
  return PRESETS.map((preset) => ({ ...preset }));
}

export function generateRandomSeed() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createBonsaiSpec({ preset = "straight", seed = generateRandomSeed() } = {}) {
  const presetDef = PRESETS.find((item) => item.key === preset) ?? PRESETS[0];
  const normalizedSeed = String(seed);
  const rng = mulberry32(hashSeed(`${presetDef.key}:${normalizedSeed}`));
  const blocks = [];

  addPot(blocks, rng);
  addGroundDetails(blocks, rng);

  const trunkPoints = buildTrunkWaypoints(presetDef.key, rng);
  const trunkSamples = addVoxelPath(blocks, trunkPoints, "trunk", { step: 0.7, baseSize: 1.7 });
  const branchTips = addBranches(blocks, trunkSamples, presetDef.key, rng);
  addFoliage(blocks, trunkSamples, branchTips, presetDef.key, rng);

  return {
    blocks,
    meta: {
      presetKey: presetDef.key,
      presetLabel: presetDef.label,
      seedLabel: normalizedSeed,
    },
    cameraTarget: { x: 0, y: 3.1, z: 0 },
  };
}

function addPot(blocks, rng) {
  const width = 13;
  const depth = 9;
  const height = 2.4;
  const wall = 0.9;
  const baseY = -1.4;

  pushBlock(blocks, -width / 2, baseY, -depth / 2, width, 0.7, depth, "pot");
  pushBlock(blocks, -width / 2, baseY + 0.7, -depth / 2, width, height - 0.7, wall, "pot");
  pushBlock(blocks, -width / 2, baseY + 0.7, depth / 2 - wall, width, height - 0.7, wall, "pot");
  pushBlock(blocks, -width / 2, baseY + 0.7, -depth / 2 + wall, wall, height - 0.7, depth - wall * 2, "pot");
  pushBlock(blocks, width / 2 - wall, baseY + 0.7, -depth / 2 + wall, wall, height - 0.7, depth - wall * 2, "pot");
  pushBlock(blocks, -width / 2 - 0.35, baseY + height - 0.15, -depth / 2 - 0.25, width + 0.7, 0.35, depth + 0.5, "pot");

  const footInsetX = width / 2 - 2.1;
  const footInsetZ = depth / 2 - 1.5;
  for (const x of [-footInsetX, footInsetX]) {
    for (const z of [-footInsetZ, footInsetZ]) {
      pushBlock(blocks, x - 0.45, baseY - 0.45, z - 0.45, 0.9, 0.45, 0.9, "pot");
    }
  }

  pushBlock(blocks, -5.15, 0.35, -3.2, 10.3, 0.8, 6.4, "soil");

  if (rng() > 0.45) {
    pushBlock(blocks, -2.4, 0.6, -0.4, 1.2, 0.3, 0.8, "soil");
  }
}

function addGroundDetails(blocks, rng) {
  const mossPatches = 4 + randomInt(rng, 0, 2);
  for (let index = 0; index < mossPatches; index += 1) {
    const sx = randomRange(rng, 1.1, 2.2);
    const sz = randomRange(rng, 0.9, 1.8);
    const x = randomRange(rng, -3.9, 3.7);
    const z = randomRange(rng, -2.3, 2.1);
    pushBlock(blocks, x, SOIL_TOP, z, sx, 0.18, sz, "moss");
  }

  const stoneCount = 3 + randomInt(rng, 0, 4);
  for (let index = 0; index < stoneCount; index += 1) {
    const size = randomRange(rng, 0.4, 0.9);
    const x = randomRange(rng, -4.2, 4.0);
    const z = randomRange(rng, -2.5, 2.2);
    pushBlock(
      blocks,
      x,
      SOIL_TOP + 0.02,
      z,
      size,
      randomRange(rng, 0.15, 0.35),
      size * randomRange(rng, 0.8, 1.2),
      "stone",
    );
  }
}

function buildTrunkWaypoints(preset, rng) {
  const sway = randomRange(rng, -0.35, 0.35);
  const depthDrift = randomRange(rng, -0.25, 0.25);

  if (preset === "straight") {
    return [
      point(0, SOIL_TOP, 0),
      point(sway * 0.5, 2.7, depthDrift),
      point(sway, 5.5, depthDrift * 0.6),
      point(sway * 0.4, 7.8, -depthDrift * 0.2),
    ];
  }

  if (preset === "slant") {
    const lean = randomSign(rng) * randomRange(rng, 2.3, 3.1);
    return [
      point(0, SOIL_TOP, 0),
      point(lean * 0.28, 2.6, depthDrift),
      point(lean * 0.62, 5.0, depthDrift * 0.7),
      point(lean, 7.2, -depthDrift * 0.2),
    ];
  }

  if (preset === "windswept") {
    const direction = randomSign(rng);
    const spread = direction * randomRange(rng, 3.8, 4.8);
    return [
      point(0, SOIL_TOP, 0),
      point(spread * 0.18, 2.4, depthDrift * 0.2),
      point(spread * 0.46, 4.7, depthDrift * 0.4),
      point(spread * 0.78, 6.5, depthDrift * 0.2),
      point(spread, 7.3, -depthDrift * 0.1),
    ];
  }

  const outflow = randomSign(rng) * randomRange(rng, 4.3, 5.2);
  return [
    point(0, SOIL_TOP, 0),
    point(outflow * 0.14, 2.4, depthDrift * 0.1),
    point(outflow * 0.42, 3.8, depthDrift * 0.35),
    point(outflow * 0.82, 1.3, depthDrift * 0.55),
    point(outflow, -0.7, depthDrift * 0.4),
  ];
}

function addBranches(blocks, trunkSamples, preset, rng) {
  const directions = branchDirectionsForPreset(preset, rng);
  const anchors = [0.38, 0.58, 0.73, 0.84].slice(0, 2 + randomInt(rng, 0, 2));
  const tips = [];

  anchors.forEach((ratio, index) => {
    const anchor = trunkSamples[Math.min(trunkSamples.length - 1, Math.floor(trunkSamples.length * ratio))];
    const direction = directions[index % directions.length];
    const branchPoints = [
      point(anchor.x, anchor.y + 0.3, anchor.z),
      point(anchor.x + direction.x * 1.3, anchor.y + direction.y * 0.9, anchor.z + direction.z * 0.8),
      point(anchor.x + direction.x * 2.4, anchor.y + direction.y * 1.5, anchor.z + direction.z * 1.2),
    ];
    const branchSamples = addVoxelPath(blocks, branchPoints, "trunk", {
      step: 0.65,
      baseSize: 1.0 - index * 0.08,
    });
    tips.push(branchSamples[branchSamples.length - 1]);
  });

  return tips;
}

function addFoliage(blocks, trunkSamples, branchTips, preset, rng) {
  const trunkTop = trunkSamples[trunkSamples.length - 1];
  const targets = [trunkTop, ...branchTips];
  const maxClusters = preset === "windswept" ? 5 : 4;
  const clusters = targets.slice(0, maxClusters);
  const flowDirection = Math.sign(trunkTop.x || 1);

  clusters.forEach((target, index) => {
    const flattened = preset === "semiCascade" ? 0.85 : 1;
    const bias = preset === "windswept" ? flowDirection * 1.9 : 0;
    const count = 7 + randomInt(rng, 0, 4);
    for (let piece = 0; piece < count; piece += 1) {
      const sx = randomRange(rng, 0.75, 1.45);
      const sy = randomRange(rng, 0.55, 1.15) * flattened;
      const sz = randomRange(rng, 0.75, 1.4);
      const radius = index === 0 ? 1.45 : 1.1;
      const xJitter =
        preset === "windswept"
          ? randomRange(rng, -radius * 0.15, radius * 0.85) * flowDirection
          : randomRange(rng, -radius, radius);
      const baseX = preset === "windswept" ? trunkTop.x + flowDirection * (index * 0.45) : target.x;
      const x = baseX + xJitter + bias;
      const y = target.y + randomRange(rng, -0.6, 0.8);
      const z = target.z + randomRange(rng, -radius * 0.8, radius * 0.8);
      pushBlock(blocks, x, y, z, sx, sy, sz, "leaf");
    }
  });
}

function addVoxelPath(blocks, waypoints, material, { step, baseSize }) {
  const samples = [];
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const start = waypoints[index];
    const end = waypoints[index + 1];
    const segmentLength = distance(start, end);
    const steps = Math.max(2, Math.ceil(segmentLength / step));

    for (let sampleIndex = 0; sampleIndex < steps; sampleIndex += 1) {
      const t = sampleIndex / steps;
      const x = lerp(start.x, end.x, t);
      const y = lerp(start.y, end.y, t);
      const z = lerp(start.z, end.z, t);
      const progress = (index + t) / (waypoints.length - 1);
      const size = Math.max(0.85, baseSize - progress * (baseSize - 0.92));
      const block = {
        x: x - size / 2,
        y,
        z: z - size / 2,
        sx: size,
        sy: Math.max(0.7, size * 0.95),
        sz: size,
        material,
      };

      blocks.push(block);
      samples.push({ x, y: y + block.sy * 0.55, z, size });
    }
  }

  const last = waypoints[waypoints.length - 1];
  samples.push({ x: last.x, y: last.y, z: last.z, size: 0.9 });
  return samples;
}

function branchDirectionsForPreset(preset, rng) {
  const spread = randomRange(rng, 0.9, 1.2);
  if (preset === "windswept") {
    const direction = randomSign(rng);
    return [
      { x: direction * 1.5 * spread, y: 0.2, z: 0.25 },
      { x: direction * 1.8 * spread, y: 0.05, z: -0.15 },
      { x: direction * 1.2 * spread, y: 0.12, z: 0.35 },
    ];
  }

  if (preset === "semiCascade") {
    const direction = randomSign(rng);
    return [
      { x: direction * 1.2, y: -0.2, z: 0.1 },
      { x: direction * -0.8, y: 0.25, z: -0.2 },
      { x: direction * 1.4, y: -0.35, z: 0.2 },
    ];
  }

  if (preset === "slant") {
    const direction = randomSign(rng);
    return [
      { x: direction * 1.3, y: 0.25, z: 0.25 },
      { x: direction * -0.95, y: 0.18, z: -0.2 },
      { x: direction * 1.1, y: 0.15, z: 0.15 },
    ];
  }

  return [
    { x: 1.1 * spread, y: 0.24, z: 0.15 },
    { x: -0.95 * spread, y: 0.18, z: -0.18 },
    { x: 0.75 * spread, y: 0.1, z: 0.28 },
  ];
}

function point(x, y, z) {
  return { x, y, z };
}

function pushBlock(blocks, x, y, z, sx, sy, sz, material) {
  blocks.push({ x, y, z, sx, sy, sz, material });
}

function hashSeed(input) {
  let hash = 1779033703 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return (hash >>> 0) || 1;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), value | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRange(rng, min, max) {
  return min + (max - min) * rng();
}

function randomInt(rng, min, max) {
  return Math.floor(randomRange(rng, min, max + 1));
}

function randomSign(rng) {
  return rng() > 0.5 ? 1 : -1;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
