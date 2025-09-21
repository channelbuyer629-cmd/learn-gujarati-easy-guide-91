import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, BookOpen, Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { WordBankUploader } from '@/components/WordBankUploader';
import { WordBankStats } from '@/components/WordBankStats';

interface WordItem {
  id: string;
  gujarati_word: string;
  gujarati_synonyms?: string;
  gujarati_antonyms?: string;
  gujarati_idioms?: string;
  english_meaning: string;
  usage_example_gujarati: string;
  usage_example_english: string;
  difficulty_level: number;
  created_at: string;
}

interface WordProgress {
  id: string;
  word_id: string;
  word_type: string;
  is_learned: boolean;
  times_reviewed: number;
}

const WordBank = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [synonyms, setSynonyms] = useState<WordItem[]>([]);
  const [antonyms, setAntonyms] = useState<WordItem[]>([]);
  const [idioms, setIdioms] = useState<WordItem[]>([]);
  const [wordProgress, setWordProgress] = useState<WordProgress[]>([]);
  const [currentIndexes, setCurrentIndexes] = useState({
    synonym: 0,
    antonym: 0,
    idiom: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'synonym' | 'antonym' | 'idiom'>('synonym');
  const [showUploader, setShowUploader] = useState(false);

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchAllWordData();
    if (user) {
      fetchWordProgress();
    }
  }, [user]);

  const fetchAllWordData = async () => {
    try {
      const [synonymsData, antonymsData, idiomsData] = await Promise.all([
        supabase.from('synonyms').select('*').order('difficulty_level', { ascending: true }),
        supabase.from('antonyms').select('*').order('difficulty_level', { ascending: true }),
        supabase.from('idioms').select('*').order('difficulty_level', { ascending: true })
      ]);

      if (synonymsData.error) throw synonymsData.error;
      if (antonymsData.error) throw antonymsData.error;
      if (idiomsData.error) throw idiomsData.error;

      setSynonyms(synonymsData.data || []);
      setAntonyms(antonymsData.data || []);
      setIdioms(idiomsData.data || []);
    } catch (error) {
      console.error('Error fetching word data:', error);
      toast({
        title: "Error",
        description: "Failed to load word bank content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWordProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('word_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setWordProgress(data || []);
    } catch (error) {
      console.error('Error fetching word progress:', error);
    }
  };

  const getCurrentWords = () => {
    switch (activeTab) {
      case 'synonym': return synonyms;
      case 'antonym': return antonyms;
      case 'idiom': return idioms;
      default: return [];
    }
  };

  const getCurrentIndex = () => currentIndexes[activeTab];
  const getCurrentWord = () => getCurrentWords()[getCurrentIndex()];

  const updateProgress = async (wordId: string, learned: boolean) => {
    if (!user) return;

    try {
      const existingProgress = wordProgress.find(
        p => p.word_id === wordId && p.word_type === activeTab
      );

      if (existingProgress) {
        const { error } = await supabase
          .from('word_progress')
          .update({
            is_learned: learned,
            times_reviewed: existingProgress.times_reviewed + 1,
            last_reviewed: new Date().toISOString(),
            learned_at: learned ? new Date().toISOString() : null
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('word_progress')
          .insert({
            user_id: user.id,
            word_type: activeTab,
            word_id: wordId,
            is_learned: learned,
            times_reviewed: 1,
            last_reviewed: new Date().toISOString(),
            learned_at: learned ? new Date().toISOString() : null
          });

        if (error) throw error;
      }


      fetchWordProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const navigateWord = (direction: 'prev' | 'next') => {
    const currentWords = getCurrentWords();
    const currentIndex = getCurrentIndex();
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex < currentWords.length - 1 ? currentIndex + 1 : 0;
      // Mark current word as learned when moving to next
      const currentWord = getCurrentWord();
      if (currentWord) {
        updateProgress(currentWord.id, true);
      }
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentWords.length - 1;
    }

    setCurrentIndexes(prev => ({
      ...prev,
      [activeTab]: newIndex
    }));
  };

  const getProgressStats = (wordType: string) => {
    const typeProgress = wordProgress.filter(p => p.word_type === wordType);
    const learned = typeProgress.filter(p => p.is_learned).length;
    const total = getCurrentWords().length;
    return { learned, total };
  };

  const getWordTypeDisplay = (type: string) => {
    switch (type) {
      case 'synonym': return 'પર્યાયવાચી (Synonyms)';
      case 'antonym': return 'વિલોમ (Antonyms)';
      case 'idiom': return 'મહાવરો (Idioms)';
      default: return type;
    }
  };

  const renderWordCard = () => {
    const currentWord = getCurrentWord();
    if (!currentWord) return null;

    const wordContent = activeTab === 'synonym' ? currentWord.gujarati_synonyms :
                      activeTab === 'antonym' ? currentWord.gujarati_antonyms :
                      currentWord.gujarati_idioms;

    const stats = getProgressStats(activeTab);

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-center flex-1">
              {getWordTypeDisplay(activeTab)}
            </CardTitle>
            <Badge variant="secondary">
              {getCurrentIndex() + 1} / {getCurrentWords().length}
            </Badge>
          </div>
          <CardDescription className="text-center">
            Progress: {stats.learned}/{stats.total} Learned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Word Display in Exact Format */}
          <div className="text-center space-y-4 p-8 bg-muted/30 rounded-lg">
            <div className="text-3xl font-bold text-primary">
              {currentWord.gujarati_word} = {wordContent}
            </div>
            <div className="text-xl text-muted-foreground">
              (English Meaning: {currentWord.english_meaning})
            </div>
          </div>

          {/* Usage Example */}
          <div className="space-y-4 p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <h4 className="font-semibold text-lg text-primary">Usage Example:</h4>
            <div className="space-y-3">
              <p className="text-xl font-medium text-foreground">{currentWord.usage_example_gujarati}</p>
              <p className="text-lg text-muted-foreground italic">
                {currentWord.usage_example_english}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              variant="outline"
              onClick={() => navigateWord('prev')}
              className="flex items-center gap-2 px-6 py-3"
              size="lg"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Word
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Difficulty Level</div>
              <div className="text-lg font-semibold">{currentWord.difficulty_level}</div>
            </div>
            
            <Button
              onClick={() => navigateWord('next')}
              className="flex items-center gap-2 px-6 py-3"
              size="lg"
            >
              Next Word
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading word bank...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Word Bank</h1>
          {isTeacher && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUploader(!showUploader)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </div>
          )}
        </div>

        {/* Teacher Upload Panel */}
        {isTeacher && showUploader && (
          <WordBankUploader onSuccess={() => {
            fetchAllWordData();
            setShowUploader(false);
          }} />
        )}

        {/* Teacher Stats Panel */}
        {isTeacher && (
          <WordBankStats />
        )}

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="synonym" className="flex items-center gap-2">
              <span>પર્યાયવાચી</span>
              <Badge variant="outline" className="text-xs">
                {getProgressStats('synonym').learned}/{synonyms.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="antonym" className="flex items-center gap-2">
              <span>વિલોમ</span>
              <Badge variant="outline" className="text-xs">
                {getProgressStats('antonym').learned}/{antonyms.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="idiom" className="flex items-center gap-2">
              <span>મહાવરો</span>
              <Badge variant="outline" className="text-xs">
                {getProgressStats('idiom').learned}/{idioms.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {getCurrentWords().length === 0 ? (
              <Card className="text-center p-8">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No {getWordTypeDisplay(activeTab).toLowerCase()} available
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isTeacher 
                    ? `Upload some ${activeTab}s to get started!` 
                    : `Your teacher will add ${activeTab}s soon.`}
                </p>
                {isTeacher && (
                  <Button onClick={() => setShowUploader(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {getWordTypeDisplay(activeTab)}
                  </Button>
                )}
              </Card>
            ) : (
              renderWordCard()
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WordBank;