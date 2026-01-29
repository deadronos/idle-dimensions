import Decimal from "break_eternity.js";

import type { PlayerState } from "@/game/types";

export type AchievementDef = {
  id: number;
  name: string;
  description: string;
  // Runs against current player state; should be pure.
  check: (player: PlayerState) => boolean;
};

// Minimal early-game set inspired by Antimatter Dimensions' pacing.
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 1,
    name: "First Steps",
    description: "Buy a 1st Dimension.",
    check: (p) => p.dimensions[0].bought >= 1,
  },
  {
    id: 2,
    name: "Buy 10!",
    description: "Buy at least 10 of any Dimension.",
    check: (p) => p.dimensions.some((d) => d.bought >= 10),
  },
  {
    id: 3,
    name: "Faster Than Before",
    description: "Buy 10 Tickspeed upgrades.",
    check: (p) => p.tickspeed.upgrades >= 10,
  },
  {
    id: 4,
    name: "The 5th Dimension",
    description: "Get your first Dimension Boost.",
    check: (p) => p.dimensionBoosts >= 1,
  },
  {
    id: 5,
    name: "The Big Wall",
    description: "Buy an Antimatter Galaxy.",
    check: (p) => p.galaxies >= 1,
  },
  {
    id: 6,
    name: "The Gods Are Pleased",
    description: "Perform a Dimensional Sacrifice.",
    check: (p) => p.sacrificed.gt(0),
  },
  {
    id: 7,
    name: "Eighth Dimension",
    description: "Buy an 8th Dimension.",
    check: (p) => p.dimensions[7].bought >= 1,
  },
  {
    id: 8,
    name: "Millionaire",
    description: "Reach 1e6 points.",
    check: (p) => p.points.gte(new Decimal("1e6")),
  },
  {
    id: 9,
    name: "Billionaire",
    description: "Reach 1e9 points.",
    check: (p) => p.points.gte(new Decimal("1e9")),
  },
];

export function achievementPower(player: PlayerState) {
  // AD-like global multiplier from achievements.
  return new Decimal(1.03).pow(player.achievements.length);
}

export function checkAchievements(player: PlayerState) {
  const current = new Set<number>(player.achievements);
  let unlocked = 0;
  for (const a of ACHIEVEMENTS) {
    if (current.has(a.id)) continue;
    if (a.check(player)) {
      current.add(a.id);
      unlocked += 1;
    }
  }
  if (unlocked > 0) player.achievements = Array.from(current).sort((a, b) => a - b);
  return unlocked;
}
