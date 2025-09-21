import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyLoginResult {
  points_earned: number;
  streak_count: number;
  is_new_login: boolean;
}

interface AchievementProgress {
  achievement_type: string;
  current_count: number;
  bonus_claimed: boolean;
}

export const useAchievements = (userId?: string) => {
  const [loginStreak, setLoginStreak] = useState(0);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const { toast } = useToast();

  // Handle daily login and rewards
  const handleDailyLogin = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.rpc('handle_daily_login', {
        user_id_param: userId
      });

      if (error) throw error;

      const result = data[0] as DailyLoginResult;
      setLoginStreak(result.streak_count);

      if (result.is_new_login && result.points_earned > 0) {
        let message = `Daily login reward: +${result.points_earned} points!`;
        if (result.points_earned > 10) {
          message += ` 🎉 30-day streak bonus included!`;
        }
        
        toast({
          title: "Daily Reward Earned! 🏆",
          description: message,
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error handling daily login:', error);
    }
  };

  // Track quiz/game completion and award milestone bonuses
  const trackActivity = async (activityType: 'quiz' | 'game') => {
    if (!userId) return;

    try {
      // Get current progress
      const { data: currentProgress } = await supabase
        .from('achievement_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_type', activityType)
        .single();

      const newCount = (currentProgress?.current_count || 0) + 1;
      
      // Update progress
      const { error: upsertError } = await supabase
        .from('achievement_progress')
        .upsert({
          user_id: userId,
          achievement_type: activityType,
          current_count: newCount,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,achievement_type'
        });

      if (upsertError) throw upsertError;

      // Check for milestone bonuses
      let bonusPoints = 0;
      let bonusMessage = '';

      if (activityType === 'quiz' && newCount === 30 && !currentProgress?.bonus_claimed) {
        bonusPoints = 50;
        bonusMessage = '🏅 30 Quizzes Completed Bonus!';
      } else if (activityType === 'game' && newCount === 50 && !currentProgress?.bonus_claimed) {
        bonusPoints = 50;
        bonusMessage = '🏆 50 Games Completed Bonus!';
      }

      if (bonusPoints > 0) {
        // Award bonus points
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('user_id', userId)
          .single();

        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ 
            points: (profile?.points || 0) + bonusPoints 
          })
          .eq('user_id', userId);

        if (pointsError) throw pointsError;

        // Mark bonus as claimed
        const { error: claimError } = await supabase
          .from('achievement_progress')
          .update({ bonus_claimed: true })
          .eq('user_id', userId)
          .eq('achievement_type', activityType);

        if (claimError) throw claimError;

        toast({
          title: "Achievement Unlocked! 🎉",
          description: `${bonusMessage} +${bonusPoints} bonus points!`,
        });
      }

      await fetchAchievementProgress();
    } catch (error: any) {
      console.error('Error tracking activity:', error);
    }
  };

  // Fetch current achievement progress
  const fetchAchievementProgress = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setAchievementProgress(data || []);
    } catch (error: any) {
      console.error('Error fetching achievement progress:', error);
    }
  };

  // Get current user streak
  const fetchCurrentStreak = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setLoginStreak(data?.current_streak || 0);
    } catch (error: any) {
      console.error('Error fetching streak:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCurrentStreak();
      fetchAchievementProgress();
    }
  }, [userId]);

  return {
    loginStreak,
    achievementProgress,
    handleDailyLogin,
    trackActivity,
    fetchAchievementProgress
  };
};