import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, BookOpen, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import { toast } from 'sonner';

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  questions: any[];
  difficulty_level: number;
  time_limit: number;
  category_id: string;
  created_at: string;
}

interface QuestionFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  shown: boolean;
}

export default function Quiz() {
  const { user, profile } = useAuth();
  const { trackActivity } = useAchievements(user?.id);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, QuestionFeedback>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [currentScore, setCurrentScore] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    fetchQuizzes();
    if (user) {
      loadAnsweredQuestions();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedQuiz && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedQuiz, timeRemaining]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes((data || []).map(quiz => ({
        ...quiz,
        questions: Array.isArray(quiz.questions) ? quiz.questions : []
      })));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadAnsweredQuestions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, answers')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const answeredSet = new Set<string>();
      data?.forEach(attempt => {
        if (attempt.answers && typeof attempt.answers === 'object') {
          Object.keys(attempt.answers).forEach(questionIndex => {
            answeredSet.add(`${attempt.quiz_id}-${questionIndex}`);
          });
        }
      });
      setAnsweredQuestions(answeredSet);
    } catch (error) {
      console.error('Error loading answered questions:', error);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setFeedback({});
    setCurrentScore(0);
    setQuizStartTime(new Date());
    setTimeRemaining(quiz.time_limit * 60); // Convert minutes to seconds
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (!selectedQuiz) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));

    // Show immediate feedback
    const currentQ = selectedQuiz.questions[questionIndex];
    const isCorrect = answer === currentQ.correct_answer;
    
    setFeedback(prev => ({
      ...prev,
      [questionIndex]: {
        isCorrect,
        correctAnswer: currentQ.correct_answer,
        shown: true
      }
    }));

    // Award points only if not answered before
    if (isCorrect && !answeredQuestions.has(`${selectedQuiz.id}-${questionIndex}`)) {
      setCurrentScore(prev => prev + 10);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !user || !quizStartTime) return;

    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - quizStartTime.getTime()) / 1000);

    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: selectedQuiz.id,
          score: currentScore,
          max_score: selectedQuiz.questions.length * 10,
          time_taken: timeTaken,
          answers
        });

      if (error) throw error;

      // Update user points in profile
      if (currentScore > 0) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('points')
          .eq('user_id', user.id)
          .single();

        const newPoints = (currentProfile?.points || 0) + currentScore;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error updating profile points:', profileError);
        }
      }

      toast.success(`Quiz completed! You earned ${currentScore} points!`);
      
      // Track quiz completion for achievements
      await trackActivity('quiz');
      
      setSelectedQuiz(null);
      loadAnsweredQuestions();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (level: number) => {
    const levels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level] || 'Unknown';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading quizzes...</div>
      </div>
    );
  }

  if (selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{selectedQuiz.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
              <div className="text-lg font-semibold">
                Score: {currentScore} points
              </div>
              <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                Exit Quiz
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {selectedQuiz.questions.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ.options.map((option: string, index: number) => {
                const isSelected = answers[currentQuestion] === option;
                const feedbackData = feedback[currentQuestion];
                let buttonVariant: "default" | "outline" | "destructive" | "secondary" = "outline";
                let className = "w-full justify-start text-left h-auto p-4";

                if (feedbackData?.shown && isSelected) {
                  if (feedbackData.isCorrect) {
                    className += " bg-green-100 text-green-800 border-green-300";
                  } else {
                    className += " bg-red-100 text-red-800 border-red-300";
                  }
                } else if (isSelected) {
                  buttonVariant = "default";
                }

                return (
                  <div key={index} className="space-y-1">
                    <Button
                      variant={buttonVariant}
                      className={className}
                      onClick={() => handleAnswerSelect(currentQuestion, option)}
                      disabled={feedbackData?.shown}
                    >
                      {option}
                    </Button>
                    {feedbackData?.shown && isSelected && (
                      <div className={`text-sm font-medium ${feedbackData.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {feedbackData.isCorrect ? '✓ Correct!' : `✗ Wrong. Correct answer: ${feedbackData.correctAnswer}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === selectedQuiz.questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz}>
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  disabled={!answers[currentQuestion]}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quiz Section</h1>
          <p className="text-gray-600">Test your Gujarati knowledge with interactive quizzes</p>
        </div>
        {profile?.role === 'teacher' && (
          <Button onClick={() => window.location.href = '/create-content'}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        )}
      </div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <Badge className={getDifficultyColor(quiz.difficulty_level)}>
                  {getDifficultyText(quiz.difficulty_level)}
                </Badge>
              </div>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.time_limit} min</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => startQuiz(quiz)}
                >
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Quizzes Available</h3>
            <p className="text-gray-600 mb-4">
              {profile?.role === 'teacher' 
                ? 'Create your first quiz to get started!' 
                : 'Check back later for new quizzes from your teachers.'}
            </p>
            {profile?.role === 'teacher' && (
              <Button onClick={() => window.location.href = '/create-content'}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}