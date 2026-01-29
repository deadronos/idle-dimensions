import Decimal from "break_eternity.js";

import type { PlayerState } from "@/game/types";

export type ChallengeModifier = {
  // Hard disables
  disableTickspeed?: boolean;
  disableSacrifice?: boolean;
  disableGalaxies?: boolean;
  disableTenMultiplier?: boolean;

  // Multipliers
  productionMult?: Decimal; // applies globally
  dimensionCostMult?: Decimal; // multiplies all dimension costs
  tickspeedCostMult?: Decimal; // multiplies tickspeed costs
  dimBoostBase?: Decimal; // base for boost multiplier (normally 2)
  disableGalaxyTickspeedBonus?: boolean;
};

export type ChallengeDef = {
  id: number;
  name: string;
  description: string;
  goalPoints: Decimal;
  modifier: ChallengeModifier;
  reward: string;
};

export type ChallengePermanentEffects = {
  // Stacks multiplicatively.
  globalMult: Decimal;
  // Adds to the per-upgrade tickspeed multiplier base.
  tickspeedPerUpgradeBonus: Decimal;
  // Adds to the base used for dim boost multipliers (normally 2).
  dimBoostBaseBonus: Decimal;
  // Multiplies the total sacrifice boost.
  sacrificeMult: Decimal;
  // Adds to the galaxy contribution per galaxy (per tickspeed upgrade).
  galaxyTickspeedBonusPerGalaxy: Decimal;
};

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 1,
    name: "C1: No Tickspeed",
    description: "Tickspeed upgrades are disabled.",
    goalPoints: new Decimal("1e6"),
    modifier: { disableTickspeed: true },
    reward: "Unlocks Tickspeed Autobuyer. Reward: Tickspeed upgrades are +0.01 stronger (permanent).",
  },
  {
    id: 2,
    name: "C2: Expensive Dimensions",
    description: "All Dimension costs are ×3.",
    goalPoints: new Decimal("1e7"),
    modifier: { dimensionCostMult: new Decimal(3) },
    reward: "Unlocks Dimensions Autobuyer. Reward: ×1.25 global production (permanent).",
  },
  {
    id: 3,
    name: "C3: Expensive Tickspeed",
    description: "Tickspeed costs are ×5.",
    goalPoints: new Decimal("1e8"),
    modifier: { tickspeedCostMult: new Decimal(5) },
    reward: "Unlocks Dimension Boost Autobuyer (after you have your first boost). Reward: Boost base +0.05 (permanent).",
  },
  {
    id: 4,
    name: "C4: No ×2 Milestones",
    description: "The ×2 per 10 purchases multiplier is disabled.",
    goalPoints: new Decimal("1e9"),
    modifier: { disableTenMultiplier: true },
    reward: "Unlocks Sacrifice Autobuyer (after your first sacrifice). Reward: ×1.25 to your Sacrifice multiplier (permanent).",
  },
  {
    id: 5,
    name: "C5: Weak Boosts",
    description: "Dimension Boost multipliers are weaker.",
    goalPoints: new Decimal("1e10"),
    modifier: { dimBoostBase: new Decimal(1.6) },
    reward: "Unlocks Galaxy Autobuyer (after your first galaxy). Reward: galaxies strengthen tickspeed upgrades more (permanent).",
  },
  {
    id: 6,
    name: "C6: No Galaxy Bonus",
    description: "Galaxies can be bought, but they don't strengthen Tickspeed upgrades.",
    goalPoints: new Decimal("1e11"),
    modifier: { disableGalaxyTickspeedBonus: true },
    reward: "Reward: ×1.10 global production (permanent).",
  },
  {
    id: 7,
    name: "C7: Half Production",
    description: "All production is ×0.5.",
    goalPoints: new Decimal("1e12"),
    modifier: { productionMult: new Decimal(0.5) },
    reward: "Reward: ×1.10 global production (permanent).",
  },
  {
    id: 8,
    name: "C8: Everything Costs More",
    description: "All costs are ×10.",
    goalPoints: new Decimal("1e13"),
    modifier: { dimensionCostMult: new Decimal(10), tickspeedCostMult: new Decimal(10) },
    reward: "Reward: +0.002 stronger tickspeed upgrades and ×1.15 global production (permanent).",
  },
];

export function getChallengeDef(id: number | null | undefined) {
  if (!id) return undefined;
  return CHALLENGES.find((c) => c.id === id);
}

export function isChallengeCompleted(player: PlayerState, id: number) {
  return player.completedChallenges.includes(id);
}

export function challengeRewardMultiplier(player: PlayerState) {
  // Simple, very AD-ish feel: challenges permanently stack a global multiplier.
  const n = player.completedChallenges.length;
  return new Decimal(1.05).pow(n);
}

export function challengePermanentEffects(player: PlayerState): ChallengePermanentEffects {
  const e: ChallengePermanentEffects = {
    globalMult: new Decimal(1),
    tickspeedPerUpgradeBonus: new Decimal(0),
    dimBoostBaseBonus: new Decimal(0),
    sacrificeMult: new Decimal(1),
    galaxyTickspeedBonusPerGalaxy: new Decimal(0),
  };

  for (const id of player.completedChallenges) {
    switch (id) {
      case 1:
        e.tickspeedPerUpgradeBonus = e.tickspeedPerUpgradeBonus.add(0.01);
        break;
      case 2:
        e.globalMult = e.globalMult.mul(1.25);
        break;
      case 3:
        e.dimBoostBaseBonus = e.dimBoostBaseBonus.add(0.05);
        break;
      case 4:
        e.sacrificeMult = e.sacrificeMult.mul(1.25);
        break;
      case 5:
        e.galaxyTickspeedBonusPerGalaxy = e.galaxyTickspeedBonusPerGalaxy.add(0.005);
        break;
      case 6:
        e.globalMult = e.globalMult.mul(1.1);
        break;
      case 7:
        e.globalMult = e.globalMult.mul(1.1);
        break;
      case 8:
        e.globalMult = e.globalMult.mul(1.15);
        e.tickspeedPerUpgradeBonus = e.tickspeedPerUpgradeBonus.add(0.002);
        break;
      default:
        break;
    }
  }

  return e;
}

export function currentChallengeModifier(player: PlayerState): ChallengeModifier {
  const def = getChallengeDef(player.activeChallenge);
  return def?.modifier ?? {};
}

export function checkChallengeCompletion(player: PlayerState) {
  const def = getChallengeDef(player.activeChallenge);
  if (!def) return false;
  return player.points.gte(def.goalPoints);
}
