-- Classement de « La centrale du futur » (CIPREL).
-- À exécuter une fois dans l'éditeur SQL du projet Supabase.
-- Lecture publique ; écriture uniquement via la fonction submit_score, qui valide la partie.

create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 2 and 20 and name !~ '[<>]'),
  kwh         integer     not null check (kwh between 500 and 10125),
  time_s      integer     not null check (time_s between 15 and 180000),
  errors      integer     not null check (errors between 0 and 2500),
  perfect     boolean     generated always as (errors = 0) stored,
  created_at  timestamptz not null default now()
);

create index if not exists scores_rank_idx
  on public.scores (kwh desc, time_s asc, errors asc, created_at asc);

alter table public.scores enable row level security;

drop policy if exists "classement lisible par tous" on public.scores;
create policy "classement lisible par tous"
  on public.scores for select
  to anon, authenticated
  using (true);
-- Aucune politique insert/update/delete : toute écriture directe est refusée.

-- Enregistre une partie complète (5 centrales) et renvoie le rang obtenu.
-- p_plants : { "hydrogene": { "kwh": 900, "time": 52, "errors": 0 }, ... }
create or replace function public.submit_score(p_name text, p_plants jsonb)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_kwh   integer := 0;
  v_time  integer := 0;
  v_err   integer := 0;
  v_id    uuid;
  v_rank  integer;
  v_total integer;
  k       text;
  p       jsonb;
begin
  if char_length(v_name) not between 2 and 20 or v_name ~ '[<>]' then
    raise exception 'Pseudo invalide (2 à 20 caractères).' using errcode = '22023';
  end if;

  foreach k in array array['hydrogene', 'biomasse', 'cycle', 'solaire', 'eolien'] loop
    p := p_plants -> k;
    if p is null
       or jsonb_typeof(p -> 'kwh') <> 'number'
       or jsonb_typeof(p -> 'time') <> 'number'
       or jsonb_typeof(p -> 'errors') <> 'number' then
      raise exception 'Partie incomplète.' using errcode = '22023';
    end if;
    if (p ->> 'kwh')::numeric not between 100 and 2025
       or (p ->> 'time')::numeric not between 3 and 36000
       or (p ->> 'errors')::numeric not between 0 and 500 then
      raise exception 'Partie invalide.' using errcode = '22023';
    end if;
    v_kwh  := v_kwh  + round((p ->> 'kwh')::numeric);
    v_time := v_time + round((p ->> 'time')::numeric);
    v_err  := v_err  + round((p ->> 'errors')::numeric);
  end loop;

  insert into public.scores (name, kwh, time_s, errors)
  values (v_name, v_kwh, v_time, v_err)
  returning id into v_id;

  select count(*) + 1 into v_rank
  from public.scores s
  where s.id <> v_id
    and (s.kwh > v_kwh
      or (s.kwh = v_kwh and s.time_s < v_time)
      or (s.kwh = v_kwh and s.time_s = v_time and s.errors <= v_err));

  select count(*) into v_total from public.scores;

  return json_build_object('id', v_id, 'rank', v_rank, 'total', v_total,
                           'kwh', v_kwh, 'time', v_time, 'errors', v_err);
end;
$$;

revoke all on function public.submit_score(text, jsonb) from public;
grant execute on function public.submit_score(text, jsonb) to anon, authenticated;
