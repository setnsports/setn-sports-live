-- SETN Sports Live - Phase 1
-- Run this in Supabase > SQL Editor.

create table if not exists public.games (
  id text primary key,
  home_team text not null,
  home_abbr text not null,
  away_team text not null,
  away_abbr text not null,
  home_score integer not null default 0 check (home_score >= 0),
  away_score integer not null default 0 check (away_score >= 0),
  period integer not null default 1 check (period >= 1),
  clock_seconds integer not null default 720 check (clock_seconds >= 0),
  clock_running boolean not null default false,
  clock_started_at timestamptz,
  possession text not null default 'home' check (possession in ('home','away')),
  down integer not null default 1 check (down between 1 and 4),
  distance integer not null default 10 check (distance between 1 and 99),
  yard_side text not null default 'home' check (yard_side in ('home','away')),
  yard_line integer not null default 20 check (yard_line between 1 and 50),
  last_play text not null default '',
  drive_plays integer not null default 0,
  drive_yards integer not null default 0,
  drive_seconds integer not null default 0,
  status text not null default 'pregame' check (status in ('pregame','live','final')),
  stream_url text,
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;

drop policy if exists "Public can read games" on public.games;
create policy "Public can read games"
on public.games
for select
to anon, authenticated
using (true);

-- Anonymous visitors have NO insert/update/delete policy.
-- The private server route updates games with the service-role key.

insert into public.games (
  id, home_team, home_abbr, away_team, away_abbr,
  home_score, away_score, period, clock_seconds,
  possession, down, distance, yard_side, yard_line,
  last_play, drive_plays, drive_yards, drive_seconds, status
)
values (
  'whitwell-south-pittsburg-demo',
  'Whitwell Tigers', 'WHI',
  'South Pittsburg Pirates', 'SP',
  14, 7, 2, 278,
  'home', 2, 6, 'home', 42,
  '#22 rushes for 8 yards to the WHI 42.',
  6, 28, 198, 'live'
)
on conflict (id) do update set
  home_team = excluded.home_team,
  away_team = excluded.away_team;

-- Enable Postgres Changes for this table if it is not already in the publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
end $$;
