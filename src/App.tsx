import { Clock, Sigma, Sparkles } from "lucide-react";

import type { DimensionId, Notation } from "@/game/types";
import { pointsPerSecond, productionPerSecond } from "@/game/logic";
import { formatDecimal } from "@/game/format";
import { DIMENSION_IDS } from "@/game/consts";
import { DimensionCard } from "@/components/DimensionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/lib/utils";

function msToClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export default function App() {
  const game = useGame();
  const pps = pointsPerSecond(game.player);

  const buyMaxAll = () => {
    for (const id of DIMENSION_IDS) game.buyMax(id);
  };

  const reset = () => {
    const ok = confirm("Hard reset? This deletes your local save.");
    if (ok) game.hardReset();
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "grain min-h-screen",
          game.options.reduceMotion ? "" : "motion-safe:[&_.bg-grid]:animate-grid-pan",
        )}
      >
        <div className="pointer-events-none fixed inset-0 bg-grid opacity-[0.23]" />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_500px_at_15%_10%,hsl(var(--primary)/0.18),transparent_60%),radial-gradient(900px_500px_at_85%_15%,hsl(var(--accent)/0.10),transparent_65%),radial-gradient(900px_550px_at_50%_110%,hsl(var(--primary)/0.10),transparent_60%)]" />

        <main className="relative mx-auto max-w-6xl px-4 py-10">
          <header className="mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl tracking-tight md:text-4xl">Idle Dimensions</h1>
                  <Badge variant="accent" className={cn(!game.options.reduceMotion && "animate-soft-pulse")}>
                    <Sparkles className="h-3.5 w-3.5" />
                    nested generators
                  </Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  A calculus-flavored idle prototype: higher dimensions generate lower ones; Dimension I spills into points.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={buyMaxAll}>
                  Buy max all
                </Button>
                <Button variant="destructive" onClick={reset}>
                  Reset
                </Button>
              </div>
            </div>
          </header>

          <Card className="mb-6 overflow-hidden">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div
                  className={cn(
                    "absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.12),hsl(var(--primary)/0.18))] bg-[length:220%_220%]",
                    !game.options.reduceMotion && "motion-safe:animate-shimmer",
                  )}
                />
              </div>
              <CardHeader className="relative">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                      <Sigma className="h-4 w-4" />
                      Points
                    </CardTitle>
                    <div className="mt-1 font-mono text-3xl font-semibold tracking-tight md:text-4xl">
                      {formatDecimal(game.player.points, game.options.notation)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      +{formatDecimal(pps, game.options.notation)}/s
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-lg border border-border/70 bg-background/35 p-3 backdrop-blur-sm md:min-w-[290px]">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Session clock
                      </span>
                      <span className="font-mono text-foreground">
                        {msToClock(Date.now() - game.player.createdAtMs)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Notation</span>
                      <span className="font-mono text-foreground">{game.options.notation}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="relative">
              <Tabs defaultValue="dimensions">
                <TabsList>
                  <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>

                <TabsContent value="dimensions">
                  <div className="grid gap-4 md:grid-cols-2">
                    {DIMENSION_IDS.map((id) => (
                      <DimensionCard
                        key={id}
                        id={id}
                        player={game.player}
                        options={game.options}
                        onBuyOne={() => game.buyOne(id)}
                        onBuyMax={() => game.buyMax(id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle>Production</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Points / sec</span>
                          <span className="font-mono">{formatDecimal(pps, game.options.notation)}</span>
                        </div>
                        <Separator />
                        {DIMENSION_IDS.map((id) => (
                          <div key={id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">D{id} / sec</span>
                          <span className="font-mono">
                            {formatDecimal(
                              productionPerSecond(game.player, id as DimensionId),
                              game.options.notation,
                            )}
                          </span>
                        </div>
                      ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle>Totals</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Started</span>
                          <span className="font-mono text-xs">
                            {new Date(game.player.createdAtMs).toLocaleString()}
                          </span>
                        </div>
                        <Separator />
                        {DIMENSION_IDS.map((id) => {
                          const dim = game.player.dimensions[id - 1];
                          return (
                            <div key={id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">D{id} amount</span>
                              <span className="font-mono">{formatDecimal(dim.amount, game.options.notation)}</span>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="options">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle>Display</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Notation</div>
                            <div className="text-xs text-muted-foreground">How large numbers are shown.</div>
                          </div>
                          <select
                            className="h-10 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30"
                            value={game.options.notation}
                            onChange={(e) =>
                              game.setOptions({
                                notation: e.target.value as Notation,
                              })
                            }
                          >
                            <option value="scientific">scientific</option>
                            <option value="engineering">engineering</option>
                          </select>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Reduce motion</div>
                            <div className="text-xs text-muted-foreground">Stops animated background + shimmer.</div>
                          </div>
                          <Switch
                            checked={game.options.reduceMotion}
                            onCheckedChange={(v) => game.setOptions({ reduceMotion: v })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle>Save data</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Saved to <span className="font-mono">localStorage</span> every few seconds.
                        </p>
                        <Separator />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => alert("Auto-saves every 5 seconds.")}>
                            About saves
                          </Button>
                          <Button variant="destructive" onClick={reset}>
                            Delete save
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <footer className="mt-10 text-xs text-muted-foreground">
            Tip: Buy higher tiers early — they cascade downward. Costs grow exponentially, so chaining matters.
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
