import Decimal from "break_eternity.js";
import type { GameOptions, PlayerState } from "@/game/types";
import { DIMENSION_IDS, DEFAULT_OPTIONS, baseCostFor, tickspeedCostFor } from "@/game/consts";

type PersistedV1 = {
  v: 1;
  savedAtMs: number;
  options: GameOptions;
  player: {
    createdAtMs: number;
    points: string;
    dimensions: { id: number; amount: string; bought: number; cost: string }[];
  };
};

type PersistedV2 = {
  v: 2;
  savedAtMs: number;
  options: GameOptions;
  player: {
    createdAtMs: number;
    points: string;
    tickspeed?: { upgrades: number; cost: string };
    dimensionBoosts?: number;
    galaxies?: number;
    sacrificed?: string;
    achievements?: number[];
    activeChallenge?: number | null;
    completedChallenges?: number[];
    autobuyers?: {
      dimensions?: { enabled: boolean; intervalMs: number; budgetMs?: number; mode: "one" | "ten" | "max" };
      tickspeed?: { enabled: boolean; intervalMs: number; budgetMs?: number; mode: "one" | "max" };
      dimensionBoost?: { enabled: boolean; intervalMs: number; budgetMs?: number };
      galaxy?: { enabled: boolean; intervalMs: number; budgetMs?: number };
      sacrifice?: { enabled: boolean; intervalMs: number; budgetMs?: number; minNextMult?: number };
    };
    dimensions: { id: number; amount: string; bought: number; cost: string }[];
  };
};

export type Persisted = PersistedV1 | PersistedV2;

export const STORAGE_KEY_V1 = "idle-dimensions:v1";
export const STORAGE_KEY = "idle-dimensions:v2";

export function safeParsePersisted(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed) return null;
    if (parsed.v !== 1 && parsed.v !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serialize(player: PlayerState, options: GameOptions): PersistedV2 {
  return {
    v: 2,
    savedAtMs: Date.now(),
    options,
    player: {
      createdAtMs: player.createdAtMs,
      points: player.points.toString(),
      tickspeed: {
        upgrades: player.tickspeed.upgrades,
        cost: player.tickspeed.cost.toString(),
      },
      dimensionBoosts: player.dimensionBoosts,
      galaxies: player.galaxies,
      sacrificed: player.sacrificed.toString(),
      achievements: player.achievements,
      activeChallenge: player.activeChallenge,
      completedChallenges: player.completedChallenges,
      autobuyers: {
        dimensions: {
          enabled: player.autobuyers.dimensions.enabled,
          intervalMs: player.autobuyers.dimensions.intervalMs,
          budgetMs: player.autobuyers.dimensions.budgetMs,
          mode: player.autobuyers.dimensions.mode,
        },
        tickspeed: {
          enabled: player.autobuyers.tickspeed.enabled,
          intervalMs: player.autobuyers.tickspeed.intervalMs,
          budgetMs: player.autobuyers.tickspeed.budgetMs,
          mode: player.autobuyers.tickspeed.mode,
        },
        dimensionBoost: {
          enabled: player.autobuyers.dimensionBoost.enabled,
          intervalMs: player.autobuyers.dimensionBoost.intervalMs,
          budgetMs: player.autobuyers.dimensionBoost.budgetMs,
        },
        galaxy: {
          enabled: player.autobuyers.galaxy.enabled,
          intervalMs: player.autobuyers.galaxy.intervalMs,
          budgetMs: player.autobuyers.galaxy.budgetMs,
        },
        sacrifice: {
          enabled: player.autobuyers.sacrifice.enabled,
          intervalMs: player.autobuyers.sacrifice.intervalMs,
          budgetMs: player.autobuyers.sacrifice.budgetMs,
          minNextMult: player.autobuyers.sacrifice.minNextMult,
        },
      },
      dimensions: player.dimensions.map((d) => ({
        id: d.id,
        amount: d.amount.toString(),
        bought: d.bought,
        cost: d.cost.toString(),
      })),
    },
  };
}

export function deserialize(p: Persisted): { player: PlayerState; options: GameOptions } {
  const dimsById = new Map<number, PersistedV1["player"]["dimensions"][number]>();
  for (const d of p.player.dimensions) dimsById.set(d.id, d);

  const dimensions = DIMENSION_IDS.map((id) => {
    const saved = dimsById.get(id);
    return {
      id,
      amount: new Decimal(saved?.amount ?? "0"),
      bought: saved?.bought ?? 0,
      cost: new Decimal(saved?.cost ?? baseCostFor(id).toString()),
    };
  });

  const tickspeedRaw = (p as PersistedV2).player.tickspeed;
  const tickspeedUpgrades = tickspeedRaw?.upgrades ?? 0;

  const savedBoosts = (p as PersistedV2).player.dimensionBoosts;
  const inferredBoosts = (() => {
    let highestNonzero = 1;
    for (const dim of dimensions) {
      if (dim.bought > 0 || dim.amount.gt(0)) highestNonzero = Math.max(highestNonzero, dim.id);
    }
    // In AD, boosts unlock: 4 + boosts. Clamp to 4 boosts (8 dims unlocked).
    return Math.max(0, Math.min(4, highestNonzero - 4));
  })();
  const dimensionBoosts = typeof savedBoosts === "number" ? savedBoosts : inferredBoosts;

  const galaxies = (p as PersistedV2).player.galaxies;
  const sacrificed = (p as PersistedV2).player.sacrificed;
  const achievements = (p as PersistedV2).player.achievements;
  const activeChallenge = (p as PersistedV2).player.activeChallenge;
  const completedChallenges = (p as PersistedV2).player.completedChallenges;
  const autobuyers = (p as PersistedV2).player.autobuyers;

  return {
    player: {
      createdAtMs: p.player.createdAtMs ?? Date.now(),
      points: new Decimal(p.player.points ?? "10"),
      tickspeed: {
        upgrades: tickspeedUpgrades,
        cost: new Decimal(tickspeedRaw?.cost ?? tickspeedCostFor(tickspeedUpgrades).toString()),
      },
      dimensionBoosts,
      galaxies: typeof galaxies === "number" ? galaxies : 0,
      sacrificed: new Decimal(sacrificed ?? "0"),
      achievements: Array.isArray(achievements) ? achievements.filter((x) => typeof x === "number") : [],
      activeChallenge: typeof activeChallenge === "number" ? activeChallenge : activeChallenge === null ? null : null,
      completedChallenges: Array.isArray(completedChallenges)
        ? completedChallenges.filter((x) => typeof x === "number")
        : [],
      autobuyers: {
        dimensions: {
          enabled: !!autobuyers?.dimensions?.enabled,
          intervalMs: typeof autobuyers?.dimensions?.intervalMs === "number" ? autobuyers.dimensions.intervalMs : 250,
          budgetMs: typeof autobuyers?.dimensions?.budgetMs === "number" ? autobuyers.dimensions.budgetMs : 0,
          mode:
            autobuyers?.dimensions?.mode === "one" || autobuyers?.dimensions?.mode === "ten" || autobuyers?.dimensions?.mode === "max"
              ? autobuyers.dimensions.mode
              : "ten",
        },
        tickspeed: {
          enabled: !!autobuyers?.tickspeed?.enabled,
          intervalMs: typeof autobuyers?.tickspeed?.intervalMs === "number" ? autobuyers.tickspeed.intervalMs : 500,
          budgetMs: typeof autobuyers?.tickspeed?.budgetMs === "number" ? autobuyers.tickspeed.budgetMs : 0,
          mode: autobuyers?.tickspeed?.mode === "one" || autobuyers?.tickspeed?.mode === "max" ? autobuyers.tickspeed.mode : "max",
        },
        dimensionBoost: {
          enabled: !!autobuyers?.dimensionBoost?.enabled,
          intervalMs: typeof autobuyers?.dimensionBoost?.intervalMs === "number" ? autobuyers.dimensionBoost.intervalMs : 1000,
          budgetMs: typeof autobuyers?.dimensionBoost?.budgetMs === "number" ? autobuyers.dimensionBoost.budgetMs : 0,
        },
        galaxy: {
          enabled: !!autobuyers?.galaxy?.enabled,
          intervalMs: typeof autobuyers?.galaxy?.intervalMs === "number" ? autobuyers.galaxy.intervalMs : 1500,
          budgetMs: typeof autobuyers?.galaxy?.budgetMs === "number" ? autobuyers.galaxy.budgetMs : 0,
        },
        sacrifice: {
          enabled: !!autobuyers?.sacrifice?.enabled,
          intervalMs: typeof autobuyers?.sacrifice?.intervalMs === "number" ? autobuyers.sacrifice.intervalMs : 1000,
          budgetMs: typeof autobuyers?.sacrifice?.budgetMs === "number" ? autobuyers.sacrifice.budgetMs : 0,
          minNextMult: typeof autobuyers?.sacrifice?.minNextMult === "number" ? autobuyers.sacrifice.minNextMult : 1.05,
        },
      },
      dimensions,
    },
    options: {
      notation: p.options?.notation ?? DEFAULT_OPTIONS.notation,
      reduceMotion: p.options?.reduceMotion ?? DEFAULT_OPTIONS.reduceMotion,
    },
  };
}

