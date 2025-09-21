import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatsProps {
  userId?: string;
}

interface UserStats {
  wordsLearned: number;
  practiceSessions: number;
  quizAttempts: number;
  gameAttempts: number;
  totalPoints: number;
  learningStreak: number;
}

export const ProfileStats = ({ userId }: ProfileStatsProps) => {
  const [stats, setStats] = useState<UserStats>({
    wordsLearned: 0,
    practiceSessions: 0,
    quizAttempts: 0,
    gameAttempts: 0,
    totalPoints: 0,
    learningStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Get words learned from flashcards
      const { count: flashcardsLearned } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_learned', true);

      // Get words learned from word bank (word_progress)
      const { count: wordBankLearned } = await supabase
        .from('word_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_learned', true);

      const totalWordsLearned = (flashcardsLearned || 0) + (wordBankLearned || 0);

      // Get practice sessions
      const { count: practiceSessions } = await supabase
        .from('practice_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get quiz attempts
      const { count: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get game attempts (using quiz_attempts table)
      const { count: gameAttempts } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get user profile for points and current streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('points, current_streak')
        .eq('user_id', userId)
        .single();

      setStats({
        wordsLearned: totalWordsLearned || 0,
        practiceSessions: practiceSessions || 0,
        quizAttempts: quizAttempts || 0,
        gameAttempts: gameAttempts || 0,
        totalPoints: profile?.points || 0,
        learningStreak: profile?.current_streak || 0
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Loading stats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Learning Streak</span>
        <span className="font-medium">{stats.learningStreak} days</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Words Learned</span>
        <span className="font-medium">{stats.wordsLearned}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Practice Sessions</span>
        <span className="font-medium">{stats.practiceSessions}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Quiz Attempts</span>
        <span className="font-medium">{stats.quizAttempts}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Game Sessions</span>
        <span className="font-medium">{stats.gameAttempts}</span>
      </div>
    </div>
  );
};