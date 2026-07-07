/**
 * Search-time provider capability metadata.
 *
 * `SeedSearcher.check` currently evaluates each leaf rule by dispatching through
 * `gameInfoProvider.providers[rule.type].test(rule)`.  That is correct for CPU
 * verification, but it hides which providers are suitable for a lower-level
 * prefilter that receives only flat numeric inputs (seed plus numeric rule
 * parameters) and should avoid object allocation or dynamic TypeScript calls.
 */
export interface SearchRuleCapability {
  /** True when the rule can be represented as flat numeric inputs and evaluated without provider object allocation. */
  gpuPrefilterSupported: boolean;
  /** True when the provider needs biome/map pixels or map-handler generation before the rule can be answered. */
  requiresMapGeneration: boolean;
  /** True when the normal TypeScript provider should still verify any prefilter match. */
  requiresCpuVerification: boolean;
  /** Short audit note explaining the relevant provider dependencies. */
  notes: string;
}

export const searchRuleCapabilities = {
  spells: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Static spell lookup, not a seed-search predicate in the flat numeric sense.",
  },
  weather: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Uses seeded random draws and scalar weather fields; suitable for numeric prefiltering.",
  },
  waterCave: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Single seeded random material choice; no map or generated objects required for a prefilter.",
  },
  startingFlask: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Starting item randoms reduce to scalar material/item ids.",
  },
  pacifistChest: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Delegates to chest generation, which can include spell/item structures and unlocked-spell state.",
  },
  startingSpell: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Starting spell choices are seeded random action ids and can be flattened.",
  },
  chestRandom: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Chest rolls branch into item/spell objects and depend on spell provider/unlocked spell state.",
  },
  startingBombSpell: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Starting bomb spell is a seeded random action id and can be represented numerically.",
  },
  powderStash: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Coordinate-seeded material choice; rule values can be encoded as material ids.",
  },
  potionSecret: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Coordinate-seeded material choice; rule values can be encoded as material ids.",
  },
  potionRandomMaterial: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Coordinate-seeded random material with weighted tables; flattenable to numeric material ids.",
  },
  material: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Static material metadata/i18n lookup; not a per-seed numeric predicate.",
  },
  potion: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Coordinate-seeded potion material; flattenable to numeric material ids.",
  },
  shop: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Shop tests may generate spell lists or delegate to wand generation/testGun; depends on perk state and provider objects.",
  },
  lottery: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Scalar temple/perk coordinates and lottery count drive a seeded probability check.",
  },
  biome: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Static biome metadata lookup rather than seed-dependent numeric evaluation.",
  },
  perk: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Builds perk deck/state arrays and applies picked/reroll/lottery state before matching requested perks.",
  },
  alwaysCast: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Always-cast candidates are coordinate-seeded action ids; current test is a no-op but providePos is flattenable.",
  },
  biomeModifier: {
    gpuPrefilterSupported: true,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Seeded biome modifier picks are scalar ids and do not need generated map data.",
  },
  wand: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Generates a full wand object, cards, gun stats, and always-cast state before rule matching.",
  },
  fungalShift: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Uses FungalShift.wasm and returns variable-length transformation objects/material names.",
  },
  alchemy: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: false,
    requiresCpuVerification: true,
    notes: "Uses Alchemy.wasm and allocates LC/AP material-name arrays from wasm material ids.",
  },
  map: {
    gpuPrefilterSupported: false,
    requiresMapGeneration: true,
    requiresCpuVerification: true,
    notes: "Creates map handlers, generates biome maps, scans pixels, and resolves interest-point objects.",
  },
} as const satisfies Record<string, SearchRuleCapability>;

export type SearchRuleType = keyof typeof searchRuleCapabilities;
