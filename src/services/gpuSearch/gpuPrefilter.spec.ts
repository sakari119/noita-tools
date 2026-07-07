import { afterEach, describe, expect, it } from "vitest";
import { gpuPrefilterSeeds, getGpuPrefilterPredicates, IGpuPrefilterBackend } from "./gpuPrefilter";
import { RuleType } from "../SeedInfo/infoHandler/IRule";

const rules = {
  id: "root",
  type: RuleType.AND,
  rules: [
    { id: "a", type: "startingBombSpell", val: "BOMB" },
    {
      id: "or",
      type: RuleType.OR,
      rules: [
        { id: "b", type: "weather", val: { rain_material: "acid" } },
        { id: "c", type: "startingSpell", val: "SPITTER" },
      ],
    },
  ],
};

describe("gpuPrefilter", () => {
  afterEach(() => {
    delete globalThis.__NOITA_GPU_PREFILTER__;
  });

  it("extracts only required positive predicates", () => {
    expect(getGpuPrefilterPredicates(rules as any)).toEqual([
      { id: "a", type: "startingBombSpell", params: undefined, val: "BOMB", strict: undefined },
    ]);
  });

  it("returns normalized candidate seeds from an available backend", async () => {
    const backend: IGpuPrefilterBackend = {
      isAvailable: () => true,
      supportsPredicate: predicate => predicate.type === "startingBombSpell",
      prefilter: async request => {
        expect(request.predicates).toHaveLength(1);
        return [12, 10, 10, 9, 20, 11.5];
      },
    };
    globalThis.__NOITA_GPU_PREFILTER__ = backend;

    await expect(gpuPrefilterSeeds(10, 20, rules as any)).resolves.toEqual([10, 12]);
  });

  it("falls back when no predicates are supported", async () => {
    globalThis.__NOITA_GPU_PREFILTER__ = {
      isAvailable: () => true,
      supportsPredicate: () => false,
      prefilter: async () => {
        throw new Error("should not run");
      },
    };

    await expect(gpuPrefilterSeeds(10, 20, rules as any)).resolves.toBeUndefined();
  });
});
