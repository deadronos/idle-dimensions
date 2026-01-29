import Decimal from "break_eternity.js";

export type Notation = "scientific" | "engineering";

export type DimensionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type DimensionState = {
  id: DimensionId;
  amount: Decimal;
  bought: number;
  cost: Decimal;
};

export type PlayerState = {
  points: Decimal;
  dimensions: DimensionState[];
  createdAtMs: number;
};

export type GameOptions = {
  notation: Notation;
  reduceMotion: boolean;
};

