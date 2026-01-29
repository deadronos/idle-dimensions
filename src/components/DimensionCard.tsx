import { ChevronUp, Infinity, Lock } from "lucide-react";

import type { DimensionId } from "@/game/types";
import { boughtMultiplier, canAfford, costForNextPurchases, productionPerSecond } from "@/game/logic";
import { formatDecimal } from "@/game/format";
import type { GameOptions, PlayerState } from "@/game/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function roman(id: DimensionId) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][id - 1];
}

export function DimensionCard(props: {
  id: DimensionId;
  player: PlayerState;
  options: GameOptions;
  locked?: boolean;
  onBuyOne: () => void;
  onBuyTen: () => void;
  onBuyMax: () => void;
}) {
  const locked = props.locked ?? false;
  const dim = props.player.dimensions[props.id - 1];
  const affordable = canAfford(props.player, props.id);
  const tenCost = costForNextPurchases(props.player, props.id, 10);
  const tenAffordable = !locked && props.player.points.gte(tenCost);
  const mult = boughtMultiplier(props.player, dim.bought);
  const rate = productionPerSecond(props.player, props.id);

  const milestoneProgress = (dim.bought % 10) / 10;
  const milestoneLabel = `${dim.bought % 10}/10`;

  const producesLabel = props.id === 1 ? "Points" : `D${props.id - 1}`;
  const tierLabel = `Dimension ${roman(props.id)}`;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden",
        !locked && affordable &&
          "shadow-[0_0_0_1px_hsl(var(--primary)/0.30),0_30px_70px_-55px_hsl(var(--primary)/0.65)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -inset-24 bg-[radial-gradient(closest-side,hsl(var(--primary)/0.18),transparent)] blur-2xl" />
      </div>

      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{tierLabel}</CardTitle>
            {locked ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Locked
                </span>
                <span className="opacity-50">•</span>
                <span>Unlock via Dimension Boosts</span>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono tracking-tight">
                  Amount: {formatDecimal(dim.amount, props.options.notation)}
                </span>
                <span className="opacity-50">•</span>
                <span className="font-mono tracking-tight">Bought: {dim.bought}</span>
              </div>
            )}
          </div>
          <Badge variant={locked ? "outline" : "accent"} className="shrink-0">
            <Infinity className="h-3.5 w-3.5" />
            {locked ? "Locked" : `Tier ${props.id}`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border/70 bg-background/30 p-3">
            <div className="text-xs text-muted-foreground">Produces</div>
            <div className="mt-1 font-mono text-sm tracking-tight">
              {formatDecimal(rate, props.options.notation)}/s
              <span className="ml-2 text-muted-foreground">→ {producesLabel}</span>
            </div>
          </div>

          <div className="rounded-md border border-border/70 bg-background/30 p-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Multiplier</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 px-2 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-secondary/55">
                    x{formatDecimal(mult, props.options.notation)}
                    <ChevronUp className="h-3 w-3 opacity-80" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Doubles every 10 purchases.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2">
              <Progress value={milestoneProgress * 100} />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-mono">{milestoneLabel}</span>
                <span>Next ×2</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Cost</div>
            {locked ? (
              <div className="mt-0.5 text-sm text-muted-foreground">—</div>
            ) : (
              <div
                className={cn(
                  "mt-0.5 font-mono text-sm tracking-tight",
                  affordable ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {formatDecimal(dim.cost, props.options.notation)}
                <span className="ml-2 text-muted-foreground">points</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" className="h-10" onClick={props.onBuyMax} disabled={locked}>
              Buy max
            </Button>
            <Button variant="outline" className="h-10" onClick={props.onBuyTen} disabled={!tenAffordable}>
              Buy 10
            </Button>
            <Button className="h-10" onClick={props.onBuyOne} disabled={locked || !affordable}>
              Buy 1
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

