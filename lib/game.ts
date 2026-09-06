export type Side = "home" | "away";

export type Game = {
  id: string;
  home_team: string;
  home_abbr: string;
  away_team: string;
  away_abbr: string;
  home_score: number;
  away_score: number;
  period: number;
  clock_seconds: number;
  clock_running: boolean;
  clock_started_at: string | null;
  possession: Side;
  down: number;
  distance: number;
  yard_side: Side;
  yard_line: number;
  last_play: string;
  drive_plays: number;
  drive_yards: number;
  drive_seconds: number;
  status: "pregame" | "live" | "final";
  stream_url: string | null;
  updated_at: string;
};

export function effectiveClockSeconds(game: Game, nowMs = Date.now()) {
  if (!game.clock_running || !game.clock_started_at) return Math.max(0, game.clock_seconds);
  const started = new Date(game.clock_started_at).getTime();
  const elapsed = Math.floor((nowMs - started) / 1000);
  return Math.max(0, game.clock_seconds - elapsed);
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function periodLabel(period: number) {
  if (period <= 4) return `${period}${period === 1 ? "st" : period === 2 ? "nd" : period === 3 ? "rd" : "th"}`;
  return `OT${period - 4}`;
}

export function fieldPercent(game: Game) {
  const y = Math.max(1, Math.min(50, game.yard_line));
  return game.yard_side === "home" ? y : 100 - y;
}

export function ballOnLabel(game: Game) {
  const abbr = game.yard_side === "home" ? game.home_abbr : game.away_abbr;
  return `${abbr} ${game.yard_line}`;
}
