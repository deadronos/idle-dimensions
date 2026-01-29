import Decimal from "break_eternity.js";
import type { DimensionId } from "@/game/types";

export const DIMENSION_COUNT = 8 as const;

export const DIMENSION_IDS: DimensionId[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const DEFAULT_OPTIONS = {
  notation: "scientific",
  reduceMotion: false,
} as const;

// Antimatter Dimensions-like knobs (early-game feel)
export const TICKSPEED_MULTIPLIER_PER_UPGRADE = new Decimal(1.125);
export const TICKSPEED_BASE_COST = new Decimal(1000);
export const TICKSPEED_COST_MULTIPLIER = new Decimal(1.25);

export function baseCostFor(id: DimensionId) {
  // Costs: 10^(2*id - 1) → 10, 1e3, 1e5, ... 1e15
  return new Decimal(10).pow(2 * id - 1);
}

export function costMultiplierFor(id: DimensionId) {
  // Gentle early curve; steeper at higher tiers.
  return new Decimal(1.15 + id * 0.04);
}

export function amountPerPurchase() {
  return new Decimal(1);
}

export function multiplierForBought(bought: number) {
  // AD-style: the main multiplier pop comes from buying in tens.
  // (Each full set of 10 doubles the dimension multiplier.)
  return new Decimal(2).pow(Math.floor(bought / 10));
}

export function tickspeedCostFor(upgrades: number) {
  return TICKSPEED_BASE_COST.mul(TICKSPEED_COST_MULTIPLIER.pow(upgrades));
}

