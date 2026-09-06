"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  Game,
  ballOnLabel,
  effectiveClockSeconds,
  fieldPercent,
  formatClock,
  periodLabel,
} from "@/lib/game";

export default function LiveGame({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [tick, setTick] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (!mounted) return;
      if (error) setError(error.message);
      else setGame(data as Game);
    }

    load();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => setGame(payload.new as Game)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    const interval = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const clock = useMemo(
    () => (game ? effectiveClockSeconds(game, tick) : 0),
    [game, tick]
  );

  if (error) {
    return <main className="shell"><div className="errorCard">Could not load game: {error}</div></main>;
  }

  if (!game) {
    return <main className="shell"><div className="loading">Loading SETN Live…</div></main>;
  }

  const offense = game.possession === "home" ? game.home_abbr : game.away_abbr;
  const marker = fieldPercent(game);

  return (
    <>
      <header className="networkHeader">
        <a href="/" className="networkBrand">SETN SPORTS</a>
        <span className="livePill">{game.status === "live" ? "LIVE" : game.status.toUpperCase()}</span>
      </header>

      <main className="shell">
        <section className="scoreHero">
          <div className="teamBlock">
            <div className="teamMonogram">{game.home_abbr.slice(0, 2)}</div>
            <h1>{game.home_team}</h1>
            <div className="score">{game.home_score}</div>
            {game.possession === "home" && <div className="possession">● POSSESSION</div>}
          </div>

          <div className="gameCenter">
            <div className="clock">{formatClock(clock)} - {periodLabel(game.period)}</div>
            <div className="downDistance">{game.down}{game.down === 1 ? "st" : game.down === 2 ? "nd" : game.down === 3 ? "rd" : "th"} & {game.distance}</div>
            <div className="ballOn">Ball on {ballOnLabel(game)}</div>
          </div>

          <div className="teamBlock">
            <div className="teamMonogram">{game.away_abbr.slice(0, 2)}</div>
            <h1>{game.away_team}</h1>
            <div className="score">{game.away_score}</div>
            {game.possession === "away" && <div className="possession">● POSSESSION</div>}
          </div>
        </section>

        <div className="fieldBar" aria-label={`Ball on ${ballOnLabel(game)}`}>
          {[10,20,30,40,50,40,30,20,10].map((n, i) => (
            <span className="fieldTick" style={{ left: `${(i + 1) * 10}%` }} key={`${n}-${i}`}>{n}</span>
          ))}
          <span className="ballMarker" style={{ left: `${marker}%` }} title={ballOnLabel(game)} />
        </div>

        {game.stream_url ? (
          <a className="watchButton" href={game.stream_url} target="_blank" rel="noreferrer">▶ Watch Live</a>
        ) : (
          <div className="watchButton disabled">SETN Sports Live</div>
        )}

        <nav className="gameTabs">
          <span className="active">Gamecast</span>
          <span>Box Score</span>
          <span>Play-by-Play</span>
          <span>Team Stats</span>
          <span>Video</span>
        </nav>

        <section className="card">
          <div className="cardHeader">
            <div>
              <div className="eyebrow">CURRENT DRIVE</div>
              <strong>{offense}</strong>
            </div>
            <span>{game.drive_plays} plays • {game.drive_yards} yards • {formatClock(game.drive_seconds)}</span>
          </div>

          <div className="driveGrid">
            <div><small>Down & Distance</small><strong>{game.down} & {game.distance}</strong></div>
            <div><small>Ball On</small><strong>{ballOnLabel(game)}</strong></div>
            <div><small>Possession</small><strong>{offense}</strong></div>
          </div>

          <div className="miniField">
            <div className="endzone left">{game.home_abbr}</div>
            <div className="yardGrid">
              <div className="markerPin" style={{ left: `${marker}%` }}>●</div>
            </div>
            <div className="endzone right">{game.away_abbr}</div>
          </div>

          <div className="lastPlay">
            <div className="eyebrow">LAST PLAY</div>
            <p>{game.last_play || "No play entered yet."}</p>
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div className="eyebrow">GAME HIGHLIGHTS</div>
            <span>Coming soon</span>
          </div>
          <p className="muted">
            Video clips, player cards, box scores and full play-by-play are the next layers we will add.
          </p>
        </section>
      </main>
    </>
  );
}
