import Decimal from "break_eternity.js";
import type { DimensionId, PlayerState } from "@/game/types";
import {
  DIMENSION_IDS,
  amountPerPurchase,
  baseCostFor,
  costMultiplierFor,
  multiplierForBought,
} from "@/game/consts";

export function createNewPlayer(): PlayerState {
  return {
    createdAtMs: Date.now(),
    points: new Decimal(10),
    dimensions: DIMENSION_IDS.map((id) => ({
      id,
      amount: new Decimal(0),
      bought: 0,
      cost: baseCostFor(id),
    })),
  };
}

export function productionPerSecond(player: PlayerState, id: DimensionId) {
  const dim = player.dimensions[id - 1];
  const mult = multiplierForBought(dim.bought);
  return dim.amount.mul(mult);
}

export function pointsPerSecond(player: PlayerState) {
  return productionPerSecond(player, 1);
}

export function canAfford(player: PlayerState, id: DimensionId) {
  const dim = player.dimensions[id - 1];
  return player.points.gte(dim.cost);
}

export function buyOne(player: PlayerState, id: DimensionId) {
  const dim = player.dimensions[id - 1];
  if (!player.points.gte(dim.cost)) return false;

  player.points = player.points.sub(dim.cost);
  dim.amount = dim.amount.add(amountPerPurchase());
  dim.bought += 1;
  dim.cost = baseCostFor(id).mul(costMultiplierFor(id).pow(dim.bought));
  return true;
}

export function buyMax(player: PlayerState, id: DimensionId) {
  // Simple loop; capped to avoid long locks.
  let bought = 0;
  while (bought < 10_000 && buyOne(player, id)) bought += 1;
  return bought;
}

export function tick(player: PlayerState, dtSeconds: number) {
  const dt = new Decimal(dtSeconds);

  // Generate from the top down: D8 -> D7 -> ... -> D1 -> points
  for (let i = DIMENSION_IDS.length; i >= 2; i--) {
    const id = i as DimensionId;
    const produced = productionPerSecond(player, id).mul(dt);
    if (produced.lte(0)) continue;
    player.dimensions[id - 2].amount = player.dimensions[id - 2].amount.add(produced);
  }

  const pointsGain = pointsPerSecond(player).mul(dt);
  if (pointsGain.gt(0)) player.points = player.points.add(pointsGain);
}

