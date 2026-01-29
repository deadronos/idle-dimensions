import Decimal from "break_eternity.js";

export type Notation = "scientific" | "engineering";

export type DimensionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type DimensionState = {
  id: DimensionId;
  amount: Decimal;
  bought: number;
  cost: Decimal;
};

export type TickspeedState = {
  upgrades: number;
  cost: Decimal;
};

export type PlayerState = {
  points: Decimal;
  dimensions: DimensionState[];
  tickspeed: TickspeedState;
  dimensionBoosts: number;
  galaxies: number;
  sacrificed: Decimal;
  achievements: number[];
  activeChallenge: number | null;
  completedChallenges: number[];
  autobuyers: AutobuyersState;
  createdAtMs: number;
};

export type DimensionAutobuyerMode = "one" | "ten" | "max";
export type TickspeedAutobuyerMode = "one" | "max";

export type AutobuyerBase = {
  enabled: boolean;
  intervalMs: number;
  // Accumulator for running actions at a fixed interval.
  budgetMs: number;
};

export type AutobuyersState = {
  dimensions: AutobuyerBase & {
    mode: DimensionAutobuyerMode;
  };
  tickspeed: AutobuyerBase & {
    mode: TickspeedAutobuyerMode;
  };
  dimensionBoost: AutobuyerBase;
  galaxy: AutobuyerBase;
  sacrifice: AutobuyerBase & {
    // Only sacrifice if the next sacrifice would increase the multiplier by at least this amount.
    // Example: 1.05 means "at least +5%".
    minNextMult: number;
  };
};

export type AutobuyersPatch = {
  dimensions?: Partial<AutobuyersState["dimensions"]>;
  tickspeed?: Partial<AutobuyersState["tickspeed"]>;
  dimensionBoost?: Partial<AutobuyersState["dimensionBoost"]>;
  galaxy?: Partial<AutobuyersState["galaxy"]>;
  sacrifice?: Partial<AutobuyersState["sacrifice"]>;
};

export type GameOptions = {
  notation: Notation;
  reduceMotion: boolean;
};

