import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StudentProgress {
  student_name: string;
  student_email: string;
  synonyms_learned: number;
  antonyms_learned: number;
  idioms_learned: number;
  total_points: number;
}

export const WordBankStats = () => {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [totalCounts, setTotalCounts] = useState({
    synonyms: 0,
    antonyms: 0,
    idioms: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      // Get total counts for each word type from separate tables
      const [synonymsCount, antonymsCount, idiomsCount] = await Promise.all([
        supabase.from('synonyms').select('*', { count: 'exact', head: true }),
        supabase.from('antonyms').select('*', { count: 'exact', head: true }),
        supabase.from('idioms').select('*', { count: 'exact', head: true })
      ]);

      setTotalCounts({
        synonyms: synonymsCount.count || 0,
        antonyms: antonymsCount.count || 0,
        idioms: idiomsCount.count || 0
      });

      // Get student progress
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, points')
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      const progressData = await Promise.all(
        (students || []).map(async (student) => {
          const { data: progress } = await supabase
            .from('word_progress')
            .select('word_type, is_learned')
            .eq('user_id', student.user_id)
            .eq('is_learned', true);

          const synonymsLearned = progress?.filter(p => p.word_type === 'synonym').length || 0;
          const antonymsLearned = progress?.filter(p => p.word_type === 'antonym').length || 0;
          const idiomsLearned = progress?.filter(p => p.word_type === 'idiom').length || 0;

          return {
            student_name: student.display_name || 'Unknown',
            student_email: student.email || '',
            synonyms_learned: synonymsLearned,
            antonyms_learned: antonymsLearned,
            idioms_learned: idiomsLearned,
            total_points: student.points || 0
          };
        })
      );

      setStudentProgress(progressData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Content Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Word Bank Content Overview
          </CardTitle>
          <CardDescription>Total content available across separate datasets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCounts.synonyms}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Synonyms</div>
              <div className="text-xs text-muted-foreground mt-1">Separate dataset</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCounts.antonyms}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Antonyms</div>
              <div className="text-xs text-muted-foreground mt-1">Separate dataset</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalCounts.idioms}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Idioms</div>
              <div className="text-xs text-muted-foreground mt-1">Separate dataset</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Progress Analytics
          </CardTitle>
          <CardDescription>Per-student learning statistics and points earned</CardDescription>
        </CardHeader>
        <CardContent>
          {studentProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students have started learning yet
            </div>
          ) : (
            <div className="space-y-6">
              {studentProgress.map((student, index) => (
                <div key={index} className="p-6 border rounded-lg space-y-4 bg-card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-lg">{student.student_name}</h4>
                      <p className="text-sm text-muted-foreground">{student.student_email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {student.total_points} points
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-600 dark:text-blue-400">Synonyms</span>
                        <span className="text-sm font-semibold">
                          {student.synonyms_learned}/{totalCounts.synonyms}
                        </span>
                      </div>
                      <Progress 
                        value={totalCounts.synonyms > 0 ? (student.synonyms_learned / totalCounts.synonyms) * 100 : 0} 
                        className="h-3"
                      />
                      <div className="text-xs text-muted-foreground">
                        {totalCounts.synonyms > 0 ? Math.round((student.synonyms_learned / totalCounts.synonyms) * 100) : 0}% complete
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-600 dark:text-green-400">Antonyms</span>
                        <span className="text-sm font-semibold">
                          {student.antonyms_learned}/{totalCounts.antonyms}
                        </span>
                      </div>
                      <Progress 
                        value={totalCounts.antonyms > 0 ? (student.antonyms_learned / totalCounts.antonyms) * 100 : 0} 
                        className="h-3"
                      />
                      <div className="text-xs text-muted-foreground">
                        {totalCounts.antonyms > 0 ? Math.round((student.antonyms_learned / totalCounts.antonyms) * 100) : 0}% complete
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-600 dark:text-purple-400">Idioms</span>
                        <span className="text-sm font-semibold">
                          {student.idioms_learned}/{totalCounts.idioms}
                        </span>
                      </div>
                      <Progress 
                        value={totalCounts.idioms > 0 ? (student.idioms_learned / totalCounts.idioms) * 100 : 0} 
                        className="h-3"
                      />
                      <div className="text-xs text-muted-foreground">
                        {totalCounts.idioms > 0 ? Math.round((student.idioms_learned / totalCounts.idioms) * 100) : 0}% complete
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      Total Words Learned: {student.synonyms_learned + student.antonyms_learned + student.idioms_learned} / {totalCounts.synonyms + totalCounts.antonyms + totalCounts.idioms}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};