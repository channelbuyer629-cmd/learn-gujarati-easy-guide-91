import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Flame, Star } from 'lucide-react';

interface AchievementProgress {
  achievement_type: string;
  current_count: number;
  bonus_claimed: boolean;
}

interface AchievementsPanelProps {
  loginStreak: number;
  achievementProgress: AchievementProgress[];
}

export const AchievementsPanel = ({ loginStreak, achievementProgress }: AchievementsPanelProps) => {
  const getProgressData = (type: string) => {
    return achievementProgress.find(p => p.achievement_type === type) || {
      achievement_type: type,
      current_count: 0,
      bonus_claimed: false
    };
  };

  const quizProgress = getProgressData('quiz');
  const gameProgress = getProgressData('game');

  const achievements = [
    {
      id: 'daily_streak',
      title: '🔥 Daily Login Streak',
      description: `${loginStreak} days in a row`,
      progress: loginStreak,
      target: 30,
      reward: '+40 points at 30 days',
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      color: loginStreak >= 30 ? 'text-orange-600' : 'text-muted-foreground'
    },
    {
      id: 'quiz_master',
      title: '📚 Quiz Master',
      description: `${quizProgress.current_count}/30 quizzes completed`,
      progress: quizProgress.current_count,
      target: 30,
      reward: '+50 bonus points',
      icon: <Target className="h-5 w-5 text-blue-500" />,
      color: quizProgress.bonus_claimed ? 'text-green-600' : 'text-muted-foreground',
      completed: quizProgress.bonus_claimed
    },
    {
      id: 'game_champion',
      title: '🎮 Game Champion',
      description: `${gameProgress.current_count}/50 games completed`,
      progress: gameProgress.current_count,
      target: 50,
      reward: '+50 bonus points',
      icon: <Trophy className="h-5 w-5 text-purple-500" />,
      color: gameProgress.bonus_claimed ? 'text-green-600' : 'text-muted-foreground',
      completed: gameProgress.bonus_claimed
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          🏆 Achievements & Points System
        </CardTitle>
        <CardDescription>
          ✨ Learn Gujarati every day, collect points, and unlock rewards!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Rewards Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">🔹 Daily Rewards</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>✅ Daily Login</span>
              <Badge variant="secondary">+10 points</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              🔄 Daily login streak resets at 12:00 AM every night.
            </p>
            <p className="text-xs text-muted-foreground">
              🎯 If you log in 30 days in a row, you get a +40 point bonus!
            </p>
          </div>
        </div>

        {/* Quiz Rewards Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">🔹 Quiz Rewards</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>📚 Each Quiz Question</span>
              <Badge variant="secondary">+10 points</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>🏅 Complete 30 quizzes</span>
              <Badge variant="outline">Extra +50 points</Badge>
            </div>
          </div>
        </div>

        {/* Game Rewards Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">🔹 Game Rewards</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>🎮 Each Game Question</span>
              <Badge variant="secondary">+10 points</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>🏆 Complete 50 game plays</span>
              <Badge variant="outline">Extra +50 points</Badge>
            </div>
          </div>
        </div>

        {/* Achievement Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Your Progress
          </h4>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {achievement.icon}
                  <div>
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                    <div className="text-xs text-muted-foreground">{achievement.reward}</div>
                  </div>
                </div>
                <div className="text-right">
                  {achievement.completed ? (
                    <Badge className="bg-green-100 text-green-800">Completed ✓</Badge>
                  ) : (
                    <div className="text-sm font-medium">
                      {Math.min(achievement.progress, achievement.target)}/{achievement.target}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};