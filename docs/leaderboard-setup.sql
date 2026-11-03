-- Run once in a Supabase project's SQL editor. Only an anon/publishable key
-- belongs in leaderboard-config.js; never expose a service_role key.
create table if not exists public.hop_scores (
 id uuid primary key,
 nickname text not null check (char_length(nickname) between 1 and 16),
 character text not null check (character in ('snow','cat')),
 score integer not null check (score between 1 and 100000),
 created_at timestamptz not null default now()
);
create index if not exists hop_scores_ranking on public.hop_scores(character,score desc,created_at asc);
alter table public.hop_scores enable row level security;
revoke all on public.hop_scores from anon,authenticated;
grant select(nickname,character,score,created_at) on public.hop_scores to anon,authenticated;
drop policy if exists "Public rankings" on public.hop_scores;
create policy "Public rankings" on public.hop_scores for select to anon,authenticated using (true);
create or replace function public.submit_hop_score(run_id uuid,player_name text,player_character text,player_score integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if run_id is null or player_name is null or char_length(btrim(player_name)) not between 1 and 16
 or player_character is null or player_character not in ('snow','cat')
 or player_score is null or player_score not between 1 and 100000 then
  raise exception 'Invalid score';
 end if;
 insert into public.hop_scores(id,nickname,character,score)
 values(run_id,btrim(player_name),player_character,player_score)
 on conflict(id) do nothing;
end;
$$;
revoke all on function public.submit_hop_score(uuid,text,text,integer) from public;
grant execute on function public.submit_hop_score(uuid,text,text,integer) to anon,authenticated;
