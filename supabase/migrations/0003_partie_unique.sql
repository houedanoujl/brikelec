-- Anti-triche du classement : chaque partie porte l'identifiant de son jeton
-- (émis et signé par le serveur du site) et ne s'enregistre qu'une fois.
-- À exécuter une fois dans l'éditeur SQL du projet Supabase, après
-- 0002_une_centrale.sql et AVANT de mettre en ligne la version du site qui
-- envoie p_game.

alter table public.scores add column if not exists game_id uuid;
create unique index if not exists scores_game_id_key on public.scores (game_id);

-- Remplace la version à quatre paramètres : sans identifiant de partie, plus d'écriture.
drop function if exists public.submit_plant_score(text, text, integer, integer);

-- Enregistre une partie et renvoie le rang obtenu.
-- Le score est calculé ici : 1000 kWh + 10 kWh par seconde restante sur 2:00.
-- Une partie déjà enregistrée lève unique_violation (409 côté API).
create or replace function public.submit_plant_score(p_game uuid, p_name text, p_plant text, p_time integer, p_errors integer)
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
  if p_game is null then
    raise exception 'Partie non vérifiée.' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 20 or v_name ~ '[<>]' then
    raise exception 'Pseudo invalide (2 à 20 caractères).' using errcode = '22023';
  end if;
  if p_plant is null or p_plant not in ('hydrogene', 'biomasse', 'cycle', 'solaire', 'eolien') then
    raise exception 'Centrale inconnue.' using errcode = '22023';
  end if;
  if p_time is null or p_time not between 8 and 120
     or p_errors is null or p_errors not between 0 and 500 then
    raise exception 'Partie invalide.' using errcode = '22023';
  end if;

  v_kwh := 1000 + (120 - p_time) * 10;

  insert into public.scores (game_id, name, plant, kwh, time_s, errors)
  values (p_game, v_name, p_plant, v_kwh, p_time, p_errors)
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

revoke all on function public.submit_plant_score(uuid, text, text, integer, integer) from public;
grant execute on function public.submit_plant_score(uuid, text, text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';
