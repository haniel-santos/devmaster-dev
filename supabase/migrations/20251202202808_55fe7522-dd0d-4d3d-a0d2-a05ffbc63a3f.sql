-- Add streak columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date date DEFAULT NULL;

-- Create function to update streaks
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity date;
  v_current_streak integer;
  v_longest_streak integer;
  v_today date := CURRENT_DATE;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak 
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM profiles 
  WHERE id = p_user_id;

  -- If no activity yet or first time
  IF v_last_activity IS NULL THEN
    UPDATE profiles 
    SET current_streak = 1, 
        longest_streak = GREATEST(1, v_longest_streak),
        last_activity_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- If already active today, do nothing
  IF v_last_activity = v_today THEN
    RETURN;
  END IF;

  -- If active yesterday, increment streak
  IF v_last_activity = v_today - 1 THEN
    v_current_streak := v_current_streak + 1;
    UPDATE profiles 
    SET current_streak = v_current_streak,
        longest_streak = GREATEST(v_current_streak, v_longest_streak),
        last_activity_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- Streak broken, reset to 1
  UPDATE profiles 
  SET current_streak = 1,
      last_activity_date = v_today
  WHERE id = p_user_id;
END;
$$;