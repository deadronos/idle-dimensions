import Decimal from "break_eternity.js";
import type { GameOptions, PlayerState } from "@/game/types";
import { DIMENSION_IDS, DEFAULT_OPTIONS, baseCostFor } from "@/game/consts";

type Persisted = {
  v: 1;
  savedAtMs: number;
  options: GameOptions;
  player: {
    createdAtMs: number;
    points: string;
    dimensions: { id: number; amount: string; bought: number; cost: string }[];
  };
};

export const STORAGE_KEY = "idle-dimensions:v1";

export function safeParsePersisted(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed || parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serialize(player: PlayerState, options: GameOptions): Persisted {
  return {
    v: 1,
    savedAtMs: Date.now(),
    options,
    player: {
      createdAtMs: player.createdAtMs,
      points: player.points.toString(),
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
  const dimsById = new Map<number, Persisted["player"]["dimensions"][number]>();
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

  return {
    player: {
      createdAtMs: p.player.createdAtMs ?? Date.now(),
      points: new Decimal(p.player.points ?? "10"),
      dimensions,
    },
    options: {
      notation: p.options?.notation ?? DEFAULT_OPTIONS.notation,
      reduceMotion: p.options?.reduceMotion ?? DEFAULT_OPTIONS.reduceMotion,
    },
  };
}

