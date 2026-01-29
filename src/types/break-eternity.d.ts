declare module "break_eternity.js" {
  export default class Decimal {
    mantissa: number;
    exponent: number;
    layer: number;

    constructor(value?: number | string | Decimal);

    add(value: DecimalSource): Decimal;
    sub(value: DecimalSource): Decimal;
    mul(value: DecimalSource): Decimal;
    div(value: DecimalSource): Decimal;
    pow(value: DecimalSource): Decimal;
    floor(): Decimal;
    log10(): Decimal;

    lt(value: DecimalSource): boolean;
    lte(value: DecimalSource): boolean;
    gt(value: DecimalSource): boolean;
    gte(value: DecimalSource): boolean;

    toNumber(): number;
    toString(): string;
  }

  export type DecimalSource = Decimal | number | string;
}

