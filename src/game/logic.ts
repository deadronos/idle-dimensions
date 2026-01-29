import Decimal from "break_eternity.js";

import type { DimensionId, PlayerState } from "@/game/types";
import { achievementPower, checkAchievements } from "@/game/achievements";
import {
  challengePermanentEffects,
  challengeRewardMultiplier,
  checkChallengeCompletion,
  currentChallengeModifier,
  getChallengeDef,
} from "@/game/challenges";
import {
  DIMENSION_IDS,
  amountPerPurchase,
  baseCostFor,
  costMultiplierFor,
  multiplierForBought,
  TICKSPEED_MULTIPLIER_PER_UPGRADE,
  tickspeedCostFor,
} from "@/game/consts";

type DimBoostRequirement = {
  tier: DimensionId;
  amount: number;
};

type GalaxyRequirement = {
  tier: DimensionId;
  amount: number;
};

function createDefaultAutobuyers(): PlayerState["autobuyers"] {
  return {
    dimensions: {
      enabled: false,
      intervalMs: 250,
      budgetMs: 0,
      mode: "ten",
    },
    tickspeed: {
      enabled: false,
      intervalMs: 500,
      budgetMs: 0,
      mode: "max",
    },
    dimensionBoost: {
      enabled: false,
      intervalMs: 1000,
      budgetMs: 0,
    },
    galaxy: {
      enabled: false,
      intervalMs: 1500,
      budgetMs: 0,
    },
    sacrifice: {
      enabled: false,
      intervalMs: 1000,
      budgetMs: 0,
      minNextMult: 1.05,
    },
  };
}

function resetRun(player: PlayerState) {
  // Shared reset behavior for pre-infinity prestige layers.
  player.points = new Decimal(10);
  player.tickspeed.upgrades = 0;
  player.tickspeed.cost = tickspeedCostFor(0).mul(tickspeedCostMultiplier(player));
  player.sacrificed = new Decimal(0);

  for (const id of DIMENSION_IDS) {
    const dim = player.dimensions[id - 1];
    dim.amount = new Decimal(0);
    dim.bought = 0;
    dim.cost = baseCostFor(id).mul(dimensionCostMultiplier(player));
  }
}

function hardResetRun(player: PlayerState) {
  // Like "start a new run": clears boost/galaxy layers as well.
  player.dimensionBoosts = 0;
  player.galaxies = 0;
  resetRun(player);
}

export function createNewPlayer(): PlayerState {
  return {
    createdAtMs: Date.now(),
    points: new Decimal(10),
    tickspeed: {
      upgrades: 0,
      cost: tickspeedCostFor(0),
    },
    dimensionBoosts: 0,
    galaxies: 0,
    sacrificed: new Decimal(0),
    achievements: [],
    activeChallenge: null,
    completedChallenges: [],
    autobuyers: createDefaultAutobuyers(),
    dimensions: DIMENSION_IDS.map((id) => ({
      id,
      amount: new Decimal(0),
      bought: 0,
      cost: baseCostFor(id),
    })),
  };
}

export function isInChallenge(player: PlayerState) {
  return !!player.activeChallenge;
}

export function dimensionAutobuyerUnlocked(player: PlayerState) {
  // AD-ish: unlock through early challenges.
  return player.completedChallenges.includes(2);
}

export function tickspeedAutobuyerUnlocked(player: PlayerState) {
  return player.completedChallenges.includes(1);
}

export function dimensionBoostAutobuyerUnlocked(player: PlayerState) {
  // Later challenge + achievement gate (feels more like AD progression).
  return player.completedChallenges.includes(3) && player.achievements.includes(4);
}

export function sacrificeAutobuyerUnlocked(player: PlayerState) {
  return player.completedChallenges.includes(4) && player.achievements.includes(6);
}

export function galaxyAutobuyerUnlocked(player: PlayerState) {
  return player.completedChallenges.includes(5) && player.achievements.includes(5);
}

export function dimensionCostMultiplier(player: PlayerState) {
  const m = currentChallengeModifier(player);
  return m.dimensionCostMult ?? new Decimal(1);
}

export function tickspeedCostMultiplier(player: PlayerState) {
  const m = currentChallengeModifier(player);
  return m.tickspeedCostMult ?? new Decimal(1);
}

function globalProductionMultiplier(player: PlayerState) {
  const m = currentChallengeModifier(player);
  const challengeRunMult = m.productionMult ?? new Decimal(1);
  const perm = challengePermanentEffects(player);
  return achievementPower(player)
    .mul(challengeRewardMultiplier(player))
    .mul(perm.globalMult)
    .mul(challengeRunMult);
}

export function startChallenge(player: PlayerState, id: number) {
  const def = getChallengeDef(id);
  if (!def) return false;
  player.activeChallenge = def.id;
  hardResetRun(player);

  // Reset autobuyer timers so they don't instantly spam after reset.
  player.autobuyers.dimensions.budgetMs = 0;
  player.autobuyers.tickspeed.budgetMs = 0;
  player.autobuyers.dimensionBoost.budgetMs = 0;
  player.autobuyers.galaxy.budgetMs = 0;
  player.autobuyers.sacrifice.budgetMs = 0;
  return true;
}

export function exitChallenge(player: PlayerState) {
  if (!player.activeChallenge) return false;
  player.activeChallenge = null;
  hardResetRun(player);

  player.autobuyers.dimensions.budgetMs = 0;
  player.autobuyers.tickspeed.budgetMs = 0;
  player.autobuyers.dimensionBoost.budgetMs = 0;
  player.autobuyers.galaxy.budgetMs = 0;
  player.autobuyers.sacrifice.budgetMs = 0;
  return true;
}

function sacrificeTotalBoostFromSacrificed(sacrificed: Decimal) {
  if (sacrificed.lte(0)) return new Decimal(1);
  // Simplified pre-infinity AD-like sacrifice: (log10(sacrificed)/10)^2, clamped to >= 1
  const pre = sacrificed.log10().div(10);
  const clamped = pre.lt(1) ? new Decimal(1) : pre;
  return clamped.pow(2);
}

export function sacrificeTotalBoost(player: PlayerState) {
  const perm = challengePermanentEffects(player);
  return sacrificeTotalBoostFromSacrificed(player.sacrificed).mul(perm.sacrificeMult);
}

export function sacrificeNextBoost(player: PlayerState) {
  const d1 = player.dimensions[0].amount;
  if (d1.lte(0)) return new Decimal(1);
  const perm = challengePermanentEffects(player);
  const current = sacrificeTotalBoostFromSacrificed(player.sacrificed).mul(perm.sacrificeMult);
  const after = sacrificeTotalBoostFromSacrificed(player.sacrificed.add(d1)).mul(perm.sacrificeMult);
  if (current.lte(0)) return new Decimal(1);
  const ratio = after.div(current);
  return ratio.lt(1) ? new Decimal(1) : ratio;
}

export function canSacrifice(player: PlayerState) {
  const mod = currentChallengeModifier(player);
  if (mod.disableSacrifice) return false;
  if (Math.floor(player.dimensionBoosts) < 5) return false;
  if (player.dimensions[7].amount.lte(0)) return false;
  return sacrificeNextBoost(player).gt(1);
}

export function sacrifice(player: PlayerState) {
  if (!canSacrifice(player)) return false;
  const d1 = player.dimensions[0].amount;
  player.sacrificed = player.sacrificed.add(d1);

  // Reset owned quantity of dims 1-7 only, without touching bought/cost.
  for (let i = 1; i <= 7; i++) {
    player.dimensions[i - 1].amount = new Decimal(0);
  }
  return true;
}

export function maxUnlockedDimension(player: PlayerState): DimensionId {
  // AD-like: start with 4 dims, then unlock one more per boost up to 8.
  return Math.min(8, 4 + Math.floor(player.dimensionBoosts)) as DimensionId;
}

export function isDimensionUnlocked(player: PlayerState, id: DimensionId) {
  return id <= maxUnlockedDimension(player);
}

export function dimBoostRequirement(player: PlayerState, bulk = 1): DimBoostRequirement {
  const targetResets = Math.floor(player.dimensionBoosts) + bulk;
  const tier = Math.min(targetResets + 3, 8) as DimensionId;
  let amount = 20;
  // After all 8 are unlocked (boosts >= 4), further boosts scale by +15 8th dims each.
  if (tier === 8) amount += Math.max(0, targetResets - 5) * 15;
  return { tier, amount: Math.round(amount) };
}

export function canDimBoost(player: PlayerState) {
  const req = dimBoostRequirement(player, 1);
  const dim = player.dimensions[req.tier - 1];
  return dim.amount.gte(req.amount);
}

export function dimBoostMultiplier(player: PlayerState, id: DimensionId) {
  // AD-like: each boost gives ×2 to D1; higher tiers apply it one fewer time.
  const boosts = Math.floor(player.dimensionBoosts);
  const exp = boosts + 1 - id;
  if (exp <= 0) return new Decimal(1);
  const mod = currentChallengeModifier(player);
  const perm = challengePermanentEffects(player);
  const base = (mod.dimBoostBase ?? new Decimal(2)).add(perm.dimBoostBaseBonus);
  return base.pow(exp);
}

export function tickspeedMultiplierPerUpgradeFromGalaxies(
  galaxies: number,
  basePerUpgrade: Decimal = TICKSPEED_MULTIPLIER_PER_UPGRADE,
  extraBonusPerGalaxy: Decimal = new Decimal(0),
) {
  // Simplified AD-like behavior:
  // - First two galaxies: +0.02 each
  // - After that: +0.002 each
  const g = Math.max(0, Math.floor(galaxies));
  const bonus = g <= 0 ? 0 : g <= 2 ? 0.02 * g : 0.04 + (g - 2) * 0.002;
  return basePerUpgrade.add(bonus).add(extraBonusPerGalaxy.mul(g));
}

export function tickspeedMultiplierPerUpgrade(player: PlayerState) {
  const mod = currentChallengeModifier(player);
  const perm = challengePermanentEffects(player);
  const base = TICKSPEED_MULTIPLIER_PER_UPGRADE.add(perm.tickspeedPerUpgradeBonus);
  if (mod.disableGalaxyTickspeedBonus) return base;
  return tickspeedMultiplierPerUpgradeFromGalaxies(player.galaxies, base, perm.galaxyTickspeedBonusPerGalaxy);
}

export function tickspeedMultiplierFromUpgrades(upgrades: number, galaxies = 0) {
  // Legacy helper (no player context): uses baseline scaling.
  return tickspeedMultiplierPerUpgradeFromGalaxies(galaxies).pow(upgrades);
}

export function tickspeedMultiplier(player: PlayerState) {
  const mod = currentChallengeModifier(player);
  if (mod.disableTickspeed) return new Decimal(1);
  return tickspeedMultiplierPerUpgrade(player).pow(player.tickspeed.upgrades);
}

export function tickspeedPerSecond(player: PlayerState) {
  // Display helper to match AD-style "Total Tickspeed: X / sec" wording.
  return new Decimal(1).mul(tickspeedMultiplier(player));
}

export function boughtMultiplier(player: PlayerState, bought: number) {
  const mod = currentChallengeModifier(player);
  if (mod.disableTenMultiplier) return new Decimal(1);
  return multiplierForBought(bought);
}

export function productionPerSecond(player: PlayerState, id: DimensionId) {
  if (!isDimensionUnlocked(player, id)) return new Decimal(0);
  const dim = player.dimensions[id - 1];
  const buyTenMult = boughtMultiplier(player, dim.bought);
  const boostMult = dimBoostMultiplier(player, id);
  const sacMult = id === 8 ? sacrificeTotalBoost(player) : new Decimal(1);
  const globalMult = globalProductionMultiplier(player);
  return dim.amount.mul(buyTenMult).mul(boostMult).mul(sacMult).mul(globalMult).mul(tickspeedMultiplier(player));
}

export function pointsPerSecond(player: PlayerState) {
  return productionPerSecond(player, 1);
}

export function canAfford(player: PlayerState, id: DimensionId) {
  if (!isDimensionUnlocked(player, id)) return false;
  const dim = player.dimensions[id - 1];
  return player.points.gte(dim.cost);
}

export function buyOne(player: PlayerState, id: DimensionId) {
  if (!isDimensionUnlocked(player, id)) return false;
  const dim = player.dimensions[id - 1];
  if (!player.points.gte(dim.cost)) return false;

  player.points = player.points.sub(dim.cost);
  dim.amount = dim.amount.add(amountPerPurchase());
  dim.bought += 1;
  dim.cost = baseCostFor(id).mul(dimensionCostMultiplier(player)).mul(costMultiplierFor(id).pow(dim.bought));
  return true;
}

export function costForNextPurchases(player: PlayerState, id: DimensionId, count: number) {
  if (count <= 0) return new Decimal(0);
  const dim = player.dimensions[id - 1];
  const m = costMultiplierFor(id);
  // Geometric series: c + c*m + ... + c*m^(n-1) = c * (m^n - 1) / (m - 1)
  return dim.cost.mul(m.pow(count).sub(1)).div(m.sub(1));
}

function buyMany(player: PlayerState, id: DimensionId, count: number) {
  if (count <= 0) return 0;
  if (!isDimensionUnlocked(player, id)) return 0;
  const dim = player.dimensions[id - 1];
  const m = costMultiplierFor(id);
  const total = costForNextPurchases(player, id, count);
  if (!player.points.gte(total)) return 0;

  player.points = player.points.sub(total);
  dim.amount = dim.amount.add(amountPerPurchase().mul(count));
  dim.bought += count;
  dim.cost = dim.cost.mul(m.pow(count));
  return count;
}

export function buyTen(player: PlayerState, id: DimensionId) {
  return buyMany(player, id, 10);
}

export function buyMax(player: PlayerState, id: DimensionId) {
  // Simple loop; capped to avoid long locks.
  let bought = 0;
  while (bought < 10_000 && buyOne(player, id)) bought += 1;
  return bought;
}

function buyMaxFast(player: PlayerState, id: DimensionId) {
  // Less clicky than buyOne loops: spam tens, then singles.
  let bought = 0;
  while (bought < 10_000) {
    const tenCost = costForNextPurchases(player, id, 10);
    if (player.points.gte(tenCost)) {
      const got = buyTen(player, id);
      if (got <= 0) break;
      bought += got;
      continue;
    }
    if (buyOne(player, id)) {
      bought += 1;
      continue;
    }
    break;
  }
  return bought;
}

export function dimensionBoost(player: PlayerState) {
  if (!canDimBoost(player)) return false;
  player.dimensionBoosts = Math.floor(player.dimensionBoosts) + 1;
  resetRun(player);
  return true;
}

export function galaxyRequirement(player: PlayerState): GalaxyRequirement {
  // AD-like early scaling: 80 8th dims for first galaxy; +60 per additional galaxy.
  const g = Math.max(0, Math.floor(player.galaxies));
  return { tier: 8, amount: 80 + g * 60 };
}

export function canBuyGalaxy(player: PlayerState) {
  const mod = currentChallengeModifier(player);
  if (mod.disableGalaxies) return false;
  if (maxUnlockedDimension(player) < 8) return false;
  const req = galaxyRequirement(player);
  const dim = player.dimensions[req.tier - 1];
  return dim.amount.gte(req.amount);
}

export function buyGalaxy(player: PlayerState) {
  if (!canBuyGalaxy(player)) return false;
  player.galaxies = Math.floor(player.galaxies) + 1;
  // Galaxy reset sets you back to 4 dims by wiping boosts.
  player.dimensionBoosts = 0;
  resetRun(player);
  return true;
}

export function canAffordTickspeed(player: PlayerState) {
  const mod = currentChallengeModifier(player);
  if (mod.disableTickspeed) return false;
  return player.points.gte(player.tickspeed.cost);
}

export function buyTickspeed(player: PlayerState) {
  const mod = currentChallengeModifier(player);
  if (mod.disableTickspeed) return false;
  if (!player.points.gte(player.tickspeed.cost)) return false;
  player.points = player.points.sub(player.tickspeed.cost);
  player.tickspeed.upgrades += 1;
  player.tickspeed.cost = tickspeedCostFor(player.tickspeed.upgrades).mul(tickspeedCostMultiplier(player));
  return true;
}

function runAutobuyers(player: PlayerState, dtSeconds: number) {
  const dtMs = dtSeconds * 1000;

  // Tickspeed
  if (tickspeedAutobuyerUnlocked(player) && player.autobuyers.tickspeed.enabled) {
    const a = player.autobuyers.tickspeed;
    a.budgetMs += dtMs;
    let triggers = 0;
    while (a.budgetMs >= a.intervalMs && triggers < 25) {
      a.budgetMs -= a.intervalMs;
      triggers += 1;
      if (a.mode === "one") {
        buyTickspeed(player);
      } else {
        let bought = 0;
        while (bought < 5_000 && buyTickspeed(player)) bought += 1;
      }
    }
  }

  // Dimensions
  if (dimensionAutobuyerUnlocked(player) && player.autobuyers.dimensions.enabled) {
    const a = player.autobuyers.dimensions;
    a.budgetMs += dtMs;
    let triggers = 0;
    while (a.budgetMs >= a.intervalMs && triggers < 25) {
      a.budgetMs -= a.intervalMs;
      triggers += 1;

      const maxDim = maxUnlockedDimension(player);
      for (let i = maxDim; i >= 1; i--) {
        const id = i as DimensionId;
        if (a.mode === "one") buyOne(player, id);
        else if (a.mode === "ten") buyTen(player, id);
        else buyMaxFast(player, id);
      }
    }
  }

  // Sacrifice
  if (sacrificeAutobuyerUnlocked(player) && player.autobuyers.sacrifice.enabled) {
    const a = player.autobuyers.sacrifice;
    a.budgetMs += dtMs;
    const min = Math.max(1, Number.isFinite(a.minNextMult) ? a.minNextMult : 1.05);
    let triggers = 0;
    while (a.budgetMs >= a.intervalMs && triggers < 10) {
      a.budgetMs -= a.intervalMs;
      triggers += 1;
      const next = sacrificeNextBoost(player);
      if (next.gte(min)) sacrifice(player);
    }
  }

  // Dimension Boost
  if (dimensionBoostAutobuyerUnlocked(player) && player.autobuyers.dimensionBoost.enabled) {
    const a = player.autobuyers.dimensionBoost;
    a.budgetMs += dtMs;
    let triggers = 0;
    while (a.budgetMs >= a.intervalMs && triggers < 10) {
      a.budgetMs -= a.intervalMs;
      triggers += 1;
      dimensionBoost(player);
    }
  }

  // Galaxy
  if (galaxyAutobuyerUnlocked(player) && player.autobuyers.galaxy.enabled) {
    const a = player.autobuyers.galaxy;
    a.budgetMs += dtMs;
    let triggers = 0;
    while (a.budgetMs >= a.intervalMs && triggers < 10) {
      a.budgetMs -= a.intervalMs;
      triggers += 1;
      buyGalaxy(player);
    }
  }
}

export function tick(player: PlayerState, dtSeconds: number) {
  const dt = new Decimal(dtSeconds);

  // Automation happens before production, like "autobuyers act, then you generate".
  runAutobuyers(player, dtSeconds);

  // Generate from the top down: Dn -> ... -> D1 -> points
  const maxDim = maxUnlockedDimension(player);
  for (let i = maxDim; i >= 2; i--) {
    const id = i as DimensionId;
    const produced = productionPerSecond(player, id).mul(dt);
    if (produced.lte(0)) continue;
    player.dimensions[id - 2].amount = player.dimensions[id - 2].amount.add(produced);
  }

  const pointsGain = pointsPerSecond(player).mul(dt);
  if (pointsGain.gt(0)) player.points = player.points.add(pointsGain);

  // Achievements: cheap linear scan over small list.
  checkAchievements(player);

  // Challenges: check completion after all gains.
  if (checkChallengeCompletion(player)) {
    const id = player.activeChallenge;
    if (id && !player.completedChallenges.includes(id)) {
      player.completedChallenges = [...player.completedChallenges, id].sort((a, b) => a - b);
    }
    // Completing a challenge exits it and starts a fresh run.
    player.activeChallenge = null;
    hardResetRun(player);
  }
}
