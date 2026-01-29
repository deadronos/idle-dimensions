import Decimal from "break_eternity.js";
import type { Notation } from "@/game/types";

function formatMantissa(m: number) {
  if (m >= 100) return m.toFixed(0);
  if (m >= 10) return m.toFixed(1);
  return m.toFixed(2);
}

function groupInt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatDecimal(value: Decimal, notation: Notation): string {
  if (!Number.isFinite(value.toNumber()) && value.layer > 0) {
    // Extremely large — keep it compact.
    return `10↑↑${value.layer}`;
  }

  if (value.lt(0)) return `-${formatDecimal(value.mul(-1), notation)}`;
  if (value.lt(1e6)) {
    const n = value.toNumber();
    if (!Number.isFinite(n)) return value.toString();
    const decimals = n < 1000 ? 2 : n < 1e5 ? 1 : 0;
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  }

  // Prefer native mantissa/exponent if present; otherwise fall back to log10-based.
  const exp =
    typeof value.exponent === "number" && Number.isFinite(value.exponent)
      ? value.exponent
      : Math.floor(value.log10().toNumber());

  const mantissa =
    typeof value.mantissa === "number" && Number.isFinite(value.mantissa)
      ? value.mantissa
      : value.div(new Decimal(10).pow(exp)).toNumber();

  if (notation === "engineering") {
    const engExp = Math.floor(exp / 3) * 3;
    const engMant = mantissa * Math.pow(10, exp - engExp);
    return `${formatMantissa(engMant)}e${groupInt(engExp)}`;
  }

  return `${formatMantissa(mantissa)}e${groupInt(exp)}`;
}
