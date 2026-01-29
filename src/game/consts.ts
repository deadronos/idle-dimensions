import Decimal from "break_eternity.js";
import type { DimensionId } from "@/game/types";

export const DIMENSION_COUNT = 8 as const;

export const DIMENSION_IDS: DimensionId[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const DEFAULT_OPTIONS = {
  notation: "scientific",
  reduceMotion: false,
} as const;

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
  // A readable, familiar feeling: small exponential growth + a "milestone pop" every 10.
  const milestone = new Decimal(2).pow(Math.floor(bought / 10));
  const smooth = new Decimal(1.05).pow(bought);
  return milestone.mul(smooth);
}

