-- SCORING SYSTEM: Calculate points on Match completion

-- 1. Function to calculate points for a single prediction vs match result
create or replace function public.calculate_points_for_prediction(
  pred_home int, pred_away int, 
  actual_home int, actual_away int
) returns int as $$
begin
  -- Exact score
  if pred_home = actual_home and pred_away = actual_away then
    return 3;
  end if;
  
  -- Correct Winner/Draw
  if (sign(pred_home - pred_away) = sign(actual_home - actual_away)) then
    return 1;
  end if;
  
  return 0;
end;
$$ language plpgsql immutable;

-- 2. Trigger Function to update all predictions for a finished match
create or replace function public.handle_match_result_update()
returns trigger as $$
begin
  -- Only run when status changes to 'finished'
  if (NEW.status = 'finished' and (OLD.status IS NULL or OLD.status != 'finished')) then
    -- Update all predictions for this match
    update public.predictions
    set points_awarded = public.calculate_points_for_prediction(
      home_score, away_score, 
      NEW.home_score, NEW.away_score
    )
    where match_id = NEW.id;
    
    -- Update total points for all users who had predictions for this match
    -- We use a subquery to sum up ALL finished predictions for those users
    update public.profiles
    set points = (
      select coalesce(sum(points_awarded), 0)
      from public.predictions
      where user_id = public.profiles.id
    )
    where id in (
      select user_id from public.predictions where match_id = NEW.id
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Attach the trigger to matches table
drop trigger if exists on_match_finished on public.matches;
create trigger on_match_finished
  after update on public.matches
  for each row
  execute function public.handle_match_result_update();

-- 4. Initial sync: In case there are already finished matches without points
-- (Optional, can be run manually if needed)
-- update profiles p set points = (select coalesce(sum(points_awarded), 0) from predictions where user_id = p.id);
