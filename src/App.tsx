import { Bot, CheckCircle2, Clock, Flag, Lock, Sigma, Sparkles } from "lucide-react";

import type { DimensionId, Notation } from "@/game/types";
import {
  canAffordTickspeed,
  canBuyGalaxy,
  canSacrifice,
  canDimBoost,
  dimBoostRequirement,
  galaxyRequirement,
  maxUnlockedDimension,
  pointsPerSecond,
  productionPerSecond,
  sacrificeNextBoost,
  sacrificeTotalBoost,
  tickspeedPerSecond,
  tickspeedMultiplierPerUpgrade,
} from "@/game/logic";
import { formatDecimal } from "@/game/format";
import { DIMENSION_IDS } from "@/game/consts";
import { ACHIEVEMENTS, achievementPower } from "@/game/achievements";
import { CHALLENGES, challengeRewardMultiplier, getChallengeDef } from "@/game/challenges";
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
  const ts = tickspeedPerSecond(game.player);
  const tsPerUpgrade = tickspeedMultiplierPerUpgrade(game.player);
  const tsAffordable = canAffordTickspeed(game.player);
  const maxDim = maxUnlockedDimension(game.player);
  const boostReq = dimBoostRequirement(game.player, 1);
  const boostAffordable = canDimBoost(game.player);
  const galaxyReq = galaxyRequirement(game.player);
  const galaxyAffordable = canBuyGalaxy(game.player);
  const sacrificeUnlocked = game.player.dimensionBoosts >= 5;
  const sacrificeAffordable = canSacrifice(game.player);
  const sacrificeTotal = sacrificeTotalBoost(game.player);
  const sacrificeNext = sacrificeNextBoost(game.player);
  const achPower = achievementPower(game.player);
  const challengeReward = challengeRewardMultiplier(game.player);
  const activeChallenge = getChallengeDef(game.player.activeChallenge);

  const boostAutobuyerUnlocked = game.player.completedChallenges.includes(3) && game.player.achievements.includes(4);
  const galaxyAutobuyerUnlocked = game.player.completedChallenges.includes(5) && game.player.achievements.includes(5);
  const sacrificeAutobuyerUnlocked = game.player.completedChallenges.includes(4) && game.player.achievements.includes(6);

  const buyMaxAll = () => {
    for (const id of DIMENSION_IDS) {
      if (id > maxDim) continue;
      game.buyMax(id);
    }
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
                  <TabsTrigger value="challenges">Challenges</TabsTrigger>
                  <TabsTrigger value="automation">Automation</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>

                <TabsContent value="dimensions">
                  <Card className="bg-background/30">
                    <CardHeader>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Tickspeed</CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            ADs produce ×{formatDecimal(tsPerUpgrade, game.options.notation)} faster per upgrade
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="h-10"
                            onClick={game.buyMaxTickspeed}
                            disabled={!tsAffordable}
                          >
                            Buy max
                          </Button>
                          <Button className="h-10" onClick={game.buyTickspeed} disabled={!tsAffordable}>
                            Buy 1
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-border/70 bg-background/30 p-3">
                        <div className="text-xs text-muted-foreground">Total Tickspeed</div>
                        <div className="mt-1 font-mono text-sm tracking-tight">
                          {formatDecimal(ts, game.options.notation)} / sec
                        </div>
                      </div>
                      <div className="rounded-md border border-border/70 bg-background/30 p-3">
                        <div className="text-xs text-muted-foreground">Cost</div>
                        <div className="mt-1 font-mono text-sm tracking-tight">
                          {formatDecimal(game.player.tickspeed.cost, game.options.notation)}
                          <span className="ml-2 text-muted-foreground">points</span>
                          <span className="ml-2 text-muted-foreground">(upgrades: {game.player.tickspeed.upgrades})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30">
                    <CardHeader>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Dimension Boost ({game.player.dimensionBoosts})</CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Requires: {boostReq.amount} D{boostReq.tier} Dimensions
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            className="h-10"
                            onClick={() => {
                              if (!boostAffordable) return;
                              const ok = confirm(
                                "Dimension Boost? This resets your points, dimensions, and tickspeed in exchange for unlocking progression and stronger multipliers.",
                              );
                              if (ok) game.dimensionBoost();
                            }}
                            disabled={!boostAffordable}
                          >
                            Dimension Boost
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="text-sm text-muted-foreground">
                      {game.player.dimensionBoosts < 4 ? (
                        <span>
                          Reset your Dimensions to unlock Dimension {game.player.dimensionBoosts + 5} and boost lower tiers.
                        </span>
                      ) : (
                        <span>
                          Reset your Dimensions to further increase your Dimension multipliers.
                        </span>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30">
                    <CardHeader>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Dimensional Sacrifice</CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {sacrificeUnlocked ? (
                              <>
                                Multiplier is {formatDecimal(sacrificeTotal, game.options.notation)} and will increase by ×
                                {formatDecimal(sacrificeNext, game.options.notation)}
                              </>
                            ) : (
                              <>Unlocks after 5 Dimension Boosts</>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            className="h-10"
                            onClick={() => {
                              if (!sacrificeAffordable) return;
                              const ok = confirm(
                                "Dimensional Sacrifice? This resets your 1st–7th Dimensions (but keeps their costs/bought) to boost the 8th Dimension multiplier.",
                              );
                              if (ok) game.sacrifice();
                            }}
                            disabled={!sacrificeAffordable}
                          >
                            Sacrifice (×{formatDecimal(sacrificeNext, game.options.notation)})
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="text-sm text-muted-foreground">
                      {sacrificeUnlocked
                        ? "Resets your 1st–7th Dimensions without resetting costs, and boosts 8th Dimension production."
                        : ""}
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30">
                    <CardHeader>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Antimatter Galaxies ({game.player.galaxies})</CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Requires: {galaxyReq.amount} D{galaxyReq.tier} Dimensions
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            className="h-10"
                            onClick={() => {
                              if (!galaxyAffordable) return;
                              const ok = confirm(
                                "Buy an Antimatter Galaxy? This resets your Dimensions and Dimension Boosts (and tickspeed upgrades) to make Tickspeed upgrades stronger.",
                              );
                              if (ok) game.buyGalaxy();
                            }}
                            disabled={!galaxyAffordable}
                          >
                            Buy Galaxy
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="text-sm text-muted-foreground">
                      Reset your Dimensions and Dimension Boosts to increase the power of Tickspeed upgrades.
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    {DIMENSION_IDS.map((id) => (
                      <DimensionCard
                        key={id}
                        id={id}
                        player={game.player}
                        options={game.options}
                        locked={id > maxDim}
                        onBuyOne={() => game.buyOne(id)}
                        onBuyTen={() => game.buyTen(id)}
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
                          <span className="text-muted-foreground">Tickspeed</span>
                          <span className="font-mono">{formatDecimal(ts, game.options.notation)}/s</span>
                        </div>
                        <Separator />
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

                <TabsContent value="challenges">
                  <div className="grid gap-4">
                    <Card className="bg-background/30">
                      <CardHeader>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Flag className="h-4 w-4" /> Challenges
                            </CardTitle>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Permanent reward multiplier: ×{formatDecimal(challengeReward, game.options.notation)}
                            </div>
                          </div>

                          {activeChallenge ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="accent">Running: {activeChallenge.name}</Badge>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const ok = confirm(
                                    "Exit the current challenge? This starts a fresh run (you will lose current progress).",
                                  );
                                  if (ok) game.exitChallenge();
                                }}
                              >
                                Exit
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Start a challenge to restart with restrictions and earn permanent rewards.
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      {activeChallenge ? (
                        <CardContent className="space-y-2 text-sm">
                          <div className="text-muted-foreground">{activeChallenge.description}</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              Goal: {formatDecimal(activeChallenge.goalPoints, game.options.notation)} points
                            </Badge>
                            <Badge variant="outline">
                              Current: {formatDecimal(game.player.points, game.options.notation)} points
                            </Badge>
                          </div>
                        </CardContent>
                      ) : null}
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle>Available challenges</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        {CHALLENGES.map((c) => {
                          const completed = game.player.completedChallenges.includes(c.id);
                          const running = game.player.activeChallenge === c.id;
                          const lockedByRunning = game.player.activeChallenge !== null && !running;

                          return (
                            <div
                              key={c.id}
                              className={cn(
                                "rounded-md border border-border/70 bg-background/30 p-3",
                                completed ? "" : "",
                                lockedByRunning ? "opacity-70" : "",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{c.name}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">{c.description}</div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                      Goal: {formatDecimal(c.goalPoints, game.options.notation)} pts
                                    </Badge>
                                    {completed ? <Badge variant="accent">Completed</Badge> : null}
                                    {running ? <Badge variant="accent">Running</Badge> : null}
                                  </div>
                                  <div className="mt-2 text-[11px] text-muted-foreground">Reward: {c.reward}</div>
                                </div>
                                <div className="shrink-0">
                                  <Button
                                    className="h-9"
                                    variant={running ? "outline" : "default"}
                                    disabled={lockedByRunning}
                                    onClick={() => {
                                      if (running) return;
                                      const ok = confirm(
                                        `Start ${c.name}? This starts a fresh run and wipes current progress (boosts/galaxies/dimensions/tickspeed).`,
                                      );
                                      if (ok) game.startChallenge(c.id);
                                    }}
                                  >
                                    {running ? "Running" : "Start"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="automation">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-4 w-4" /> Tickspeed Autobuyer
                        </CardTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {game.player.completedChallenges.includes(1)
                            ? "Unlocked"
                            : "Locked — complete Challenge 1 (No Tickspeed) to unlock."}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Enabled</div>
                            <div className="text-xs text-muted-foreground">Auto-buys tickspeed while you can afford it.</div>
                          </div>
                          <Switch
                            checked={game.player.autobuyers.tickspeed.enabled}
                            disabled={!game.player.completedChallenges.includes(1)}
                            onCheckedChange={(v) => game.setAutobuyers({ tickspeed: { enabled: v } })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Mode</div>
                            <div className="text-xs text-muted-foreground">Buy 1 each interval, or spam Buy Max each interval.</div>
                          </div>
                          <select
                            className="h-10 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Tickspeed autobuyer mode"
                            disabled={!game.player.completedChallenges.includes(1)}
                            value={game.player.autobuyers.tickspeed.mode}
                            onChange={(e) =>
                              game.setAutobuyers({
                                tickspeed: { mode: e.target.value as "one" | "max" },
                              })
                            }
                          >
                            <option value="one">Buy 1</option>
                            <option value="max">Buy max</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Interval (ms)</div>
                            <div className="text-xs text-muted-foreground">Lower is faster but can be spammy.</div>
                          </div>
                          <input
                            className="h-10 w-28 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Tickspeed autobuyer interval (ms)"
                            type="number"
                            min={50}
                            step={50}
                            disabled={!game.player.completedChallenges.includes(1)}
                            value={game.player.autobuyers.tickspeed.intervalMs}
                            onChange={(e) => {
                              const n = Math.max(50, Math.floor(Number(e.target.value) || 0));
                              game.setAutobuyers({ tickspeed: { intervalMs: n } });
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-4 w-4" /> Dimensions Autobuyer
                        </CardTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {game.player.completedChallenges.includes(2)
                            ? "Unlocked"
                            : "Locked — complete Challenge 2 (Expensive Dimensions) to unlock."}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Enabled</div>
                            <div className="text-xs text-muted-foreground">Auto-buys all unlocked dimensions.</div>
                          </div>
                          <Switch
                            checked={game.player.autobuyers.dimensions.enabled}
                            disabled={!game.player.completedChallenges.includes(2)}
                            onCheckedChange={(v) => game.setAutobuyers({ dimensions: { enabled: v } })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Mode</div>
                            <div className="text-xs text-muted-foreground">Controls how aggressive it buys each interval.</div>
                          </div>
                          <select
                            className="h-10 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Dimensions autobuyer mode"
                            disabled={!game.player.completedChallenges.includes(2)}
                            value={game.player.autobuyers.dimensions.mode}
                            onChange={(e) =>
                              game.setAutobuyers({
                                dimensions: { mode: e.target.value as "one" | "ten" | "max" },
                              })
                            }
                          >
                            <option value="one">Buy 1</option>
                            <option value="ten">Buy 10</option>
                            <option value="max">Buy max</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Interval (ms)</div>
                            <div className="text-xs text-muted-foreground">Lower is faster but can cost CPU.</div>
                          </div>
                          <input
                            className="h-10 w-28 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Dimensions autobuyer interval (ms)"
                            type="number"
                            min={50}
                            step={50}
                            disabled={!game.player.completedChallenges.includes(2)}
                            value={game.player.autobuyers.dimensions.intervalMs}
                            onChange={(e) => {
                              const n = Math.max(50, Math.floor(Number(e.target.value) || 0));
                              game.setAutobuyers({ dimensions: { intervalMs: n } });
                            }}
                          />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Note: Automation runs in the sim loop, so it also applies to offline progress.
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-4 w-4" /> Dimension Boost Autobuyer
                        </CardTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {boostAutobuyerUnlocked
                            ? "Unlocked"
                            : "Locked — complete Challenge 3 and get your first boost (achievement: The 5th Dimension)."}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Enabled</div>
                            <div className="text-xs text-muted-foreground">Auto-boosts when the requirement is met.</div>
                          </div>
                          <Switch
                            checked={game.player.autobuyers.dimensionBoost.enabled}
                            disabled={!boostAutobuyerUnlocked}
                            onCheckedChange={(v) => game.setAutobuyers({ dimensionBoost: { enabled: v } })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Interval (ms)</div>
                            <div className="text-xs text-muted-foreground">How often it checks to boost.</div>
                          </div>
                          <input
                            className="h-10 w-28 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Dimension Boost autobuyer interval (ms)"
                            type="number"
                            min={100}
                            step={50}
                            disabled={!boostAutobuyerUnlocked}
                            value={game.player.autobuyers.dimensionBoost.intervalMs}
                            onChange={(e) => {
                              const n = Math.max(100, Math.floor(Number(e.target.value) || 0));
                              game.setAutobuyers({ dimensionBoost: { intervalMs: n } });
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-4 w-4" /> Galaxy Autobuyer
                        </CardTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {galaxyAutobuyerUnlocked
                            ? "Unlocked"
                            : "Locked — complete Challenge 5 and buy your first galaxy (achievement: The Big Wall)."}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Enabled</div>
                            <div className="text-xs text-muted-foreground">Auto-buys galaxies when the requirement is met.</div>
                          </div>
                          <Switch
                            checked={game.player.autobuyers.galaxy.enabled}
                            disabled={!galaxyAutobuyerUnlocked}
                            onCheckedChange={(v) => game.setAutobuyers({ galaxy: { enabled: v } })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Interval (ms)</div>
                            <div className="text-xs text-muted-foreground">How often it checks to buy galaxies.</div>
                          </div>
                          <input
                            className="h-10 w-28 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Galaxy autobuyer interval (ms)"
                            type="number"
                            min={100}
                            step={50}
                            disabled={!galaxyAutobuyerUnlocked}
                            value={game.player.autobuyers.galaxy.intervalMs}
                            onChange={(e) => {
                              const n = Math.max(100, Math.floor(Number(e.target.value) || 0));
                              game.setAutobuyers({ galaxy: { intervalMs: n } });
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-4 w-4" /> Sacrifice Autobuyer
                        </CardTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {sacrificeAutobuyerUnlocked
                            ? "Unlocked"
                            : "Locked — complete Challenge 4 and perform a sacrifice (achievement: The Gods Are Pleased)."}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Enabled</div>
                            <div className="text-xs text-muted-foreground">Auto-sacrifices when it would be worth it.</div>
                          </div>
                          <Switch
                            checked={game.player.autobuyers.sacrifice.enabled}
                            disabled={!sacrificeAutobuyerUnlocked}
                            onCheckedChange={(v) => game.setAutobuyers({ sacrifice: { enabled: v } })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Min gain (×)</div>
                            <div className="text-xs text-muted-foreground">Only sacrifice if next is at least this much better.</div>
                          </div>
                          <input
                            className="h-10 w-28 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Sacrifice autobuyer minimum gain multiplier"
                            type="number"
                            min={1.01}
                            step={0.01}
                            disabled={!sacrificeAutobuyerUnlocked}
                            value={game.player.autobuyers.sacrifice.minNextMult}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const n = Number.isFinite(raw) ? Math.max(1.01, raw) : 1.05;
                              game.setAutobuyers({ sacrifice: { minNextMult: n } });
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm">Interval (ms)</div>
                            <div className="text-xs text-muted-foreground">How often it checks to sacrifice.</div>
                          </div>
                          <input
                            className="h-10 w-28 rounded-md border border-border/70 bg-background/40 px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                            aria-label="Sacrifice autobuyer interval (ms)"
                            type="number"
                            min={100}
                            step={50}
                            disabled={!sacrificeAutobuyerUnlocked}
                            value={game.player.autobuyers.sacrifice.intervalMs}
                            onChange={(e) => {
                              const n = Math.max(100, Math.floor(Number(e.target.value) || 0));
                              game.setAutobuyers({ sacrifice: { intervalMs: n } });
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="achievements">
                  <Card className="bg-background/30">
                    <CardHeader>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Achievements</CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Unlocked: {game.player.achievements.length}/{ACHIEVEMENTS.length}
                          </div>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/30 px-3 py-2 font-mono text-sm">
                          Multiplier: ×{formatDecimal(achPower, game.options.notation)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {ACHIEVEMENTS.map((a) => {
                        const unlocked = game.player.achievements.includes(a.id);
                        return (
                          <div
                            key={a.id}
                            className={cn(
                              "rounded-md border border-border/70 bg-background/30 p-3",
                              unlocked ? "" : "opacity-70",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{a.name}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
                              </div>
                              <div className={cn("shrink-0", unlocked ? "text-primary" : "text-muted-foreground")}>
                                {unlocked ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Lock className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
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
                            aria-label="Notation"
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
