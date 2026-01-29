import { useEffect, useMemo, useRef, useState } from "react";

import type { GameOptions, PlayerState } from "@/game/types";
import { DEFAULT_OPTIONS } from "@/game/consts";
import { tick, buyMax, buyOne, createNewPlayer } from "@/game/logic";
import { STORAGE_KEY, deserialize, safeParsePersisted, serialize } from "@/game/serialize";

type GameApi = {
  player: PlayerState;
  options: GameOptions;
  setOptions: (patch: Partial<GameOptions>) => void;
  buyOne: (id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => void;
  buyMax: (id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => void;
  hardReset: () => void;
};

function simulateOffline(player: PlayerState, dtSeconds: number) {
  if (dtSeconds <= 0.25) return;
  // Chunked simulation to keep it responsive.
  const chunk = 0.05;
  let remaining = dtSeconds;
  while (remaining > 0) {
    const step = Math.min(chunk, remaining);
    tick(player, step);
    remaining -= step;
  }
}

function loadInitial(): { player: PlayerState; options: GameOptions } {
  const parsed = safeParsePersisted(localStorage.getItem(STORAGE_KEY));
  if (parsed) {
    const { player, options } = deserialize(parsed);
    const now = Date.now();
    const dtSeconds = Math.min(60 * 60 * 8, Math.max(0, (now - (parsed.savedAtMs ?? now)) / 1000));
    simulateOffline(player, dtSeconds);
    // Important for React 18 StrictMode: stamp the save time immediately to avoid double offline gains.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(player, options)));
    } catch {
      // ignore
    }
    return { player, options };
  }
  return { player: createNewPlayer(), options: { ...DEFAULT_OPTIONS } };
}

export function useGame(): GameApi {
  const [{ player, options }, setSnapshot] = useState(() => {
    const { player, options } = loadInitial();
    return { player, options };
  });

  const playerRef = useRef(player);
  const optionsRef = useRef(options);
  const lastFrameRef = useRef<number>(performance.now());
  const renderBudgetRef = useRef<number>(0);
  const saveBudgetRef = useRef<number>(0);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const now = t;
      const dt = Math.min(0.25, Math.max(0, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      const p = playerRef.current;
      tick(p, dt);

      renderBudgetRef.current += dt;
      saveBudgetRef.current += dt;

      // Render ~10fps; the sim runs every frame.
      if (renderBudgetRef.current >= 0.1) {
        renderBudgetRef.current = 0;
        setSnapshot({ player: { ...p }, options: optionsRef.current });
      }

      if (saveBudgetRef.current >= 5) {
        saveBudgetRef.current = 0;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(p, optionsRef.current)));
        } catch {
          // ignore
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const api = useMemo<GameApi>(() => {
    return {
      player,
      options,
      setOptions: (patch) => {
        const next = { ...optionsRef.current, ...patch };
        optionsRef.current = next;
        setSnapshot({ player: playerRef.current, options: next });
      },
      buyOne: (id) => {
        buyOne(playerRef.current, id);
        setSnapshot({ player: { ...playerRef.current }, options: optionsRef.current });
      },
      buyMax: (id) => {
        buyMax(playerRef.current, id);
        setSnapshot({ player: { ...playerRef.current }, options: optionsRef.current });
      },
      hardReset: () => {
        localStorage.removeItem(STORAGE_KEY);
        const fresh = createNewPlayer();
        playerRef.current = fresh;
        optionsRef.current = { ...DEFAULT_OPTIONS };
        setSnapshot({ player: fresh, options: optionsRef.current });
      },
    };
  }, [player, options]);

  return api;
}
