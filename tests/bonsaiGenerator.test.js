import { describe, expect, it } from "vitest";
import { createBonsaiSpec, listPresets } from "../src/bonsaiGenerator.js";

function materialBlocks(spec, material) {
  return spec.blocks.filter((block) => block.material === material);
}

function bounds(blocks) {
  return blocks.reduce(
    (acc, block) => ({
      minX: Math.min(acc.minX, block.x),
      maxX: Math.max(acc.maxX, block.x + block.sx),
      minY: Math.min(acc.minY, block.y),
      maxY: Math.max(acc.maxY, block.y + block.sy),
      minZ: Math.min(acc.minZ, block.z),
      maxZ: Math.max(acc.maxZ, block.z + block.sz),
    }),
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity,
    },
  );
}

function centroidX(blocks) {
  const total = blocks.reduce((sum, block) => sum + block.x + block.sx / 2, 0);
  return total / blocks.length;
}

describe("listPresets", () => {
  it("returns the four required presets", () => {
    expect(listPresets()).toEqual([
      { key: "straight", label: "直幹" },
      { key: "slant", label: "斜幹" },
      { key: "windswept", label: "吹き流し" },
      { key: "semiCascade", label: "半懸崖" },
    ]);
  });
});

describe("createBonsaiSpec", () => {
  it("is deterministic for the same preset and seed", () => {
    const first = createBonsaiSpec({ preset: "straight", seed: 2026 });
    const second = createBonsaiSpec({ preset: "straight", seed: 2026 });

    expect(second).toEqual(first);
  });

  it("includes all bonsai composition materials", () => {
    const spec = createBonsaiSpec({ preset: "straight", seed: 42 });

    expect(materialBlocks(spec, "pot").length).toBeGreaterThan(0);
    expect(materialBlocks(spec, "soil").length).toBeGreaterThan(0);
    expect(materialBlocks(spec, "moss").length).toBeGreaterThan(0);
    expect(materialBlocks(spec, "stone").length).toBeGreaterThan(0);
    expect(materialBlocks(spec, "trunk").length).toBeGreaterThan(0);
    expect(materialBlocks(spec, "leaf").length).toBeGreaterThan(0);
  });

  it("keeps block count within the target budget", () => {
    const spec = createBonsaiSpec({ preset: "windswept", seed: 88 });

    expect(spec.blocks.length).toBeLessThanOrEqual(420);
  });

  it("keeps the straight style mostly centered at the apex", () => {
    const spec = createBonsaiSpec({ preset: "straight", seed: 5 });
    const trunk = materialBlocks(spec, "trunk");
    const trunkBounds = bounds(trunk);
    const topBlocks = trunk.filter((block) => block.y + block.sy >= trunkBounds.maxY - 1.5);
    const apexX = centroidX(topBlocks);

    expect(Math.abs(apexX)).toBeLessThan(1.25);
  });

  it("leans noticeably in the slant style", () => {
    const spec = createBonsaiSpec({ preset: "slant", seed: 5 });
    const trunk = materialBlocks(spec, "trunk");
    const trunkBounds = bounds(trunk);
    const topBlocks = trunk.filter((block) => block.y + block.sy >= trunkBounds.maxY - 1.5);
    const apexX = centroidX(topBlocks);

    expect(Math.abs(apexX)).toBeGreaterThan(1.5);
  });

  it("pushes foliage to one side in the windswept style", () => {
    const spec = createBonsaiSpec({ preset: "windswept", seed: 5 });
    const leaves = materialBlocks(spec, "leaf");

    expect(Math.abs(centroidX(leaves))).toBeGreaterThan(2.5);
  });

  it("drops part of the composition below the soil line in the semi-cascade style", () => {
    const spec = createBonsaiSpec({ preset: "semiCascade", seed: 5 });
    const soilTop = bounds(materialBlocks(spec, "soil")).maxY;
    const trunk = materialBlocks(spec, "trunk");

    expect(trunk.some((block) => block.y < soilTop - 1)).toBe(true);
  });
});
