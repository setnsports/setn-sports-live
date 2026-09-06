"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { Game, effectiveClockSeconds, formatClock } from "@/lib/game";

type Patch = Partial<Game>;

export default function AdminGame({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [pin, setPin] = useState("");
  const [tick, setTick] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [lastPlayDraft, setLastPlayDraft] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single();
      if (error) setMessage(error.message);
      else {
        setGame(data as Game);
        setLastPlayDraft((data as Game).last_play || "");
      }
    }
    load();

    const channel = supabase
      .channel(`admin-game-${gameId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      }, (payload) => setGame(payload.new as Game))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  useEffect(() => {
    const i = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(i);
  }, []);

  const displayedClock = useMemo(
    () => game ? effectiveClockSeconds(game, tick) : 0,
    [game, tick]
  );

  async function patch(patch: Patch) {
    setMessage("Saving…");
    const res = await fetch("/api/admin/game", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-admin-pin": pin,
      },
      body: JSON.stringify({ gameId, patch }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Saved" : (data.error || "Update failed"));
  }

  if (!game) {
    return <main className="adminShell"><h1>SETN Scorekeeper</h1><p>{message || "Loading…"}</p></main>;
  }

  function score(side: "home" | "away", amount: number) {
    const key = side === "home" ? "home_score" : "away_score";
    const current = side === "home" ? game.home_score : game.away_score;
    patch({ [key]: Math.max(0, current + amount) } as Patch);
  }

  function startClock() {
    if (game.clock_running) return;
    patch({ clock_running: true, clock_started_at: new Date().toISOString() });
  }

  function stopClock() {
    patch({
      clock_running: false,
      clock_seconds: displayedClock,
      clock_started_at: null,
    });
  }

  function changeClock(delta: number) {
    patch({
      clock_running: false,
      clock_started_at: null,
      clock_seconds: Math.max(0, displayedClock + delta),
    });
  }

  return (
    <main className="adminShell">
      <h1>SETN SCOREKEEPER</h1>
      <p className="muted">Prototype controller for {game.home_team} vs. {game.away_team}</p>

      <label className="pinLabel">
        Admin PIN
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter private PIN" />
      </label>

      <section className="adminCard adminScore">
        <div>
          <h2>{game.home_team}</h2>
          <div className="adminBigScore">{game.home_score}</div>
          <div className="buttonRow">
            {[-1,1,2,3,6].map(n => <button key={n} onClick={() => score("home", n)}>{n > 0 ? "+" : ""}{n}</button>)}
          </div>
        </div>
        <div>
          <h2>{game.away_team}</h2>
          <div className="adminBigScore">{game.away_score}</div>
          <div className="buttonRow">
            {[-1,1,2,3,6].map(n => <button key={n} onClick={() => score("away", n)}>{n > 0 ? "+" : ""}{n}</button>)}
          </div>
        </div>
      </section>

      <section className="adminCard">
        <h2>Clock</h2>
        <div className="adminClock">{formatClock(displayedClock)}</div>
        <div className="buttonRow">
          <button className="primary" onClick={startClock}>START</button>
          <button className="danger" onClick={stopClock}>STOP</button>
          <button onClick={() => changeClock(60)}>+1:00</button>
          <button onClick={() => changeClock(-60)}>-1:00</button>
          <button onClick={() => patch({ clock_running: false, clock_started_at: null, clock_seconds: 12 * 60 })}>12:00</button>
        </div>
      </section>

      <section className="adminCard">
        <h2>Quarter / Period</h2>
        <div className="buttonRow">
          {[1,2,3,4,5,6].map(p => (
            <button className={game.period === p ? "selected" : ""} key={p} onClick={() => patch({ period: p })}>
              {p <= 4 ? `Q${p}` : `OT${p-4}`}
            </button>
          ))}
        </div>
      </section>

      <section className="adminCard">
        <h2>Possession</h2>
        <div className="buttonRow">
          <button className={game.possession === "home" ? "selected" : ""} onClick={() => patch({ possession: "home" })}>{game.home_abbr}</button>
          <button className={game.possession === "away" ? "selected" : ""} onClick={() => patch({ possession: "away" })}>{game.away_abbr}</button>
        </div>
      </section>

      <section className="adminCard">
        <h2>Down & Distance</h2>
        <div className="buttonRow">
          {[1,2,3,4].map(d => <button className={game.down === d ? "selected" : ""} key={d} onClick={() => patch({ down: d })}>{d}</button>)}
        </div>
        <div className="stepper">
          <button onClick={() => patch({ distance: Math.max(1, game.distance - 1) })}>−</button>
          <strong>{game.distance} yards</strong>
          <button onClick={() => patch({ distance: Math.min(99, game.distance + 1) })}>+</button>
        </div>
      </section>

      <section className="adminCard">
        <h2>Ball Position</h2>
        <div className="buttonRow">
          <button className={game.yard_side === "home" ? "selected" : ""} onClick={() => patch({ yard_side: "home" })}>{game.home_abbr} SIDE</button>
          <button className={game.yard_side === "away" ? "selected" : ""} onClick={() => patch({ yard_side: "away" })}>{game.away_abbr} SIDE</button>
        </div>
        <div className="stepper">
          <button onClick={() => patch({ yard_line: Math.max(1, game.yard_line - 1) })}>−1</button>
          <button onClick={() => patch({ yard_line: Math.max(1, game.yard_line - 5) })}>−5</button>
          <strong>{game.yard_line}</strong>
          <button onClick={() => patch({ yard_line: Math.min(50, game.yard_line + 5) })}>+5</button>
          <button onClick={() => patch({ yard_line: Math.min(50, game.yard_line + 1) })}>+1</button>
        </div>
      </section>

      <section className="adminCard">
        <h2>Last Play</h2>
        <textarea rows={4} value={lastPlayDraft} onChange={e => setLastPlayDraft(e.target.value)} />
        <button className="primary full" onClick={() => patch({ last_play: lastPlayDraft })}>SAVE LAST PLAY</button>
      </section>

      <section className="adminCard">
        <h2>Game Status</h2>
        <div className="buttonRow">
          {(["pregame","live","final"] as const).map(s => (
            <button key={s} className={game.status === s ? "selected" : ""} onClick={() => patch({ status: s })}>{s.toUpperCase()}</button>
          ))}
        </div>
      </section>

      <div className="saveStatus">{message}</div>
      <a className="adminPublicLink" href={`/live/${gameId}`} target="_blank">Open public gamecast ↗</a>
    </main>
  );
}
