-- Nouveau jeu : une seule centrale, à assembler en 2 minutes.
-- À exécuter une fois dans l'éditeur SQL du projet Supabase, AVANT de mettre
-- en ligne la version du site qui appelle submit_plant_score.
-- Rien n'est supprimé : les anciennes parties à cinq centrales restent dans la
-- table (plant vide) mais ne sont plus classées.

alter table public.scores
  add column if not exists plant text
  check (plant is null or plant in ('hydrogene', 'biomasse', 'cycle', 'solaire', 'eolien'));

-- Une centrale peut être assemblée en moins de 15 secondes.
alter table public.scores drop constraint if exists scores_time_s_check;
alter table public.scores add constraint scores_time_s_check check (time_s between 3 and 180000);

create index if not exists scores_plant_rank_idx
  on public.scores (kwh desc, time_s asc, created_at asc)
  where plant is not null;

-- Enregistre une partie et renvoie le rang obtenu.
-- Le score est calculé ici : 1000 kWh + 10 kWh par seconde restante sur 2:00.
create or replace function public.submit_plant_score(p_name text, p_plant text, p_time integer, p_errors integer)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_kwh   integer;
  v_id    uuid;
  v_at    timestamptz;
  v_rank  integer;
  v_total integer;
begin
  if char_length(v_name) not between 2 and 20 or v_name ~ '[<>]' then
    raise exception 'Pseudo invalide (2 à 20 caractères).' using errcode = '22023';
  end if;
  if p_plant is null or p_plant not in ('hydrogene', 'biomasse', 'cycle', 'solaire', 'eolien') then
    raise exception 'Centrale inconnue.' using errcode = '22023';
  end if;
  if p_time is null or p_time not between 3 and 120
     or p_errors is null or p_errors not between 0 and 500 then
    raise exception 'Partie invalide.' using errcode = '22023';
  end if;

  v_kwh := 1000 + (120 - p_time) * 10;

  insert into public.scores (name, plant, kwh, time_s, errors)
  values (v_name, p_plant, v_kwh, p_time, p_errors)
  returning id, created_at into v_id, v_at;

  -- même ordre que le classement : kWh, puis temps, puis ancienneté
  select count(*) + 1 into v_rank
  from public.scores s
  where s.plant is not null
    and s.id <> v_id
    and (s.kwh > v_kwh
      or (s.kwh = v_kwh and s.time_s < p_time)
      or (s.kwh = v_kwh and s.time_s = p_time and s.created_at <= v_at));

  select count(*) into v_total from public.scores s where s.plant is not null;

  return json_build_object('id', v_id, 'rank', v_rank, 'total', v_total,
                           'kwh', v_kwh, 'time', p_time, 'errors', p_errors);
end;
$$;

revoke all on function public.submit_plant_score(text, text, integer, integer) from public;
grant execute on function public.submit_plant_score(text, text, integer, integer) to anon, authenticated;

-- L'ancienne fonction submit_score (cinq centrales) reste en place tant que
-- l'ancienne version du site est en ligne. Une fois la nouvelle déployée :
--   drop function if exists public.submit_score(text, jsonb);

-- Rafraîchit le cache de l'API (rend la colonne et la fonction visibles tout de suite)
notify pgrst, 'reload schema';
