-- Create daily_logins table to track login streaks
CREATE TABLE public.daily_logins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Enable RLS
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_logins
CREATE POLICY "Users can view their own daily logins" 
ON public.daily_logins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logins" 
ON public.daily_logins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create achievement_progress table to track user progress towards achievements
CREATE TABLE public.achievement_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bonus_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for achievement_progress
CREATE POLICY "Users can view their own achievement progress" 
ON public.achievement_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievement progress" 
ON public.achievement_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress" 
ON public.achievement_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add streak_count to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN last_login_date DATE DEFAULT NULL;

-- Create function to handle daily login rewards
CREATE OR REPLACE FUNCTION public.handle_daily_login(user_id_param UUID)
RETURNS TABLE(
  points_earned INTEGER,
  streak_count INTEGER,
  is_new_login BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  existing_login_count INTEGER;
  current_profile RECORD;
  new_streak INTEGER;
  points_to_add INTEGER := 10;
  streak_bonus INTEGER := 0;
BEGIN
  -- Check if user already logged in today
  SELECT COUNT(*) INTO existing_login_count
  FROM daily_logins 
  WHERE user_id = user_id_param AND login_date = today_date;
  
  -- If already logged in today, return current streak
  IF existing_login_count > 0 THEN
    SELECT current_streak INTO new_streak
    FROM profiles 
    WHERE profiles.user_id = user_id_param;
    
    RETURN QUERY SELECT 0::INTEGER, COALESCE(new_streak, 0)::INTEGER, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Get current profile data
  SELECT * INTO current_profile
  FROM profiles 
  WHERE profiles.user_id = user_id_param;
  
  -- Calculate new streak
  IF current_profile.last_login_date = yesterday_date THEN
    -- Continue streak
    new_streak := COALESCE(current_profile.current_streak, 0) + 1;
  ELSE
    -- Start new streak
    new_streak := 1;
  END IF;
  
  -- Check for 30-day streak bonus
  IF new_streak = 30 THEN
    streak_bonus := 40;
    points_to_add := points_to_add + streak_bonus;
  END IF;
  
  -- Insert daily login record
  INSERT INTO daily_logins (user_id, login_date)
  VALUES (user_id_param, today_date);
  
  -- Update profile with new streak and points
  UPDATE profiles 
  SET 
    current_streak = new_streak,
    last_login_date = today_date,
    points = COALESCE(points, 0) + points_to_add
  WHERE profiles.user_id = user_id_param;
  
  RETURN QUERY SELECT points_to_add::INTEGER, new_streak::INTEGER, true::BOOLEAN;
END;
$$;