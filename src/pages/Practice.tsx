import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Volume2, Check, X, Edit, Plus, Trash2, Upload, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BasicLearningItem {
  id: string;
  content_type: 'alphabet' | 'number' | 'basic_word';
  english_content: string;
  gujarati_content: string;
  transliteration?: string;
  audio_url?: string;
  image_url?: string;
  order_sequence?: number;
  difficulty_level: number;
}

interface LearningProgress {
  id: string;
  content_id: string;
  is_learned: boolean;
  times_reviewed: number;
}

const Practice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [basicItems, setBasicItems] = useState<BasicLearningItem[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alphabet' | 'number' | 'basic_word'>('alphabet');
  const [isTeacher, setIsTeacher] = useState(false);
  const [editingItem, setEditingItem] = useState<BasicLearningItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showCsvUploader, setShowCsvUploader] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [formData, setFormData] = useState({
    gujarati_content: '',
    english_content: '',
    transliteration: '',
    order_sequence: '',
    difficulty_level: 1
  });

  useEffect(() => {
    fetchBasicLearningItems();
    checkUserRole();
    if (user) {
      fetchLearningProgress();
    }
    // Reset word index when switching tabs
    setCurrentWordIndex(0);
  }, [user, activeTab]);

  const checkUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setIsTeacher(data?.role === 'teacher');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchBasicLearningItems = async () => {
    try {
      // Fetch from basic_learning table
      const { data, error } = await supabase
        .from('basic_learning')
        .select('*')
        .eq('content_type', activeTab)
        .order('order_sequence', { ascending: true });

      if (error) throw error;
      
      // Transform basic learning data
      const transformedData = (data || []).map(item => ({
        id: item.id,
        content_type: item.content_type as 'alphabet' | 'number' | 'basic_word',
        english_content: item.english_content,
        gujarati_content: item.gujarati_content,
        transliteration: item.transliteration,
        audio_url: item.audio_url,
        image_url: item.image_url,
        order_sequence: item.order_sequence,
        difficulty_level: item.difficulty_level || 1
      }));

      setBasicItems(transformedData);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Error fetching basic learning items:', error);
      toast({
        title: "Error",
        description: "Failed to load learning content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningProgress = async () => {
    if (!user) return;

    try {
      // Use learning_progress table for basic_learning items
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_type', activeTab);

      if (error) throw error;
      
      const transformedProgress = (data || []).map(item => ({
        id: item.id,
        content_id: item.content_id,
        is_learned: item.is_learned || false,
        times_reviewed: item.times_reviewed || 0
      }));

      setLearningProgress(transformedProgress);
    } catch (error) {
      console.error('Error fetching learning progress:', error);
    }
  };

  const markItemLearned = async (learned: boolean) => {
    if (!user || basicItems.length === 0) return;

    const currentItem = basicItems[currentIndex];
    const existingProgress = learningProgress.find(p => p.content_id === currentItem.id);

    try {
      if (existingProgress) {
        const { error } = await supabase
          .from('learning_progress')
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
          .from('learning_progress')
          .insert({
            user_id: user.id,
            content_id: currentItem.id,
            content_type: activeTab,
            is_learned: learned,
            times_reviewed: 1,
            last_reviewed: new Date().toISOString(),
            learned_at: learned ? new Date().toISOString() : null
          });

        if (error) throw error;
      }

      // Refresh progress
      fetchLearningProgress();

      toast({
        title: learned ? "Great! 🎉" : "Keep Practicing",
        description: learned ? "+5 points earned" : "Try again later",
      });

    } catch (error) {
      console.error('Error updating learning progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'gu-IN';
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Audio Not Available",
        description: "Text-to-speech is not supported in this browser",
        variant: "destructive"
      });
    }
  };

  const getTabTitle = (type: string) => {
    switch (type) {
      case 'alphabet': return 'Alphabets (અક્ષરો)';
      case 'number': return 'Numbers (સંખ્યાઓ)';
      case 'basic_word': return 'Basic Words (મૂળભૂત શબ્દો)';
      default: return type;
    }
  };

  const handleEdit = (item: BasicLearningItem) => {
    setEditingItem(item);
    setFormData({
      gujarati_content: item.gujarati_content,
      english_content: item.english_content,
      transliteration: item.transliteration || '',
      order_sequence: item.order_sequence?.toString() || '',
      difficulty_level: item.difficulty_level
    });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setFormData({
      gujarati_content: '',
      english_content: '',
      transliteration: '',
      order_sequence: '',
      difficulty_level: 1
    });
  };

  const handleSave = async () => {
    if (!user || !isTeacher) return;

    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('basic_learning')
          .update({
            gujarati_content: formData.gujarati_content,
            english_content: formData.english_content,
            transliteration: formData.transliteration,
            order_sequence: parseInt(formData.order_sequence) || null,
            difficulty_level: formData.difficulty_level
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Success", description: "Item updated successfully" });
      } else if (isAddingNew) {
        // Add new item
        const { error } = await supabase
          .from('basic_learning')
          .insert({
            content_type: activeTab,
            gujarati_content: formData.gujarati_content,
            english_content: formData.english_content,
            transliteration: formData.transliteration,
            order_sequence: parseInt(formData.order_sequence) || null,
            difficulty_level: formData.difficulty_level,
            created_by: user.id
          });

        if (error) throw error;
        toast({ title: "Success", description: "Item added successfully" });
      }

      setEditingItem(null);
      setIsAddingNew(false);
      fetchBasicLearningItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (item: BasicLearningItem) => {
    if (!user || !isTeacher) return;
    
    if (!confirm(`Are you sure you want to delete "${item.gujarati_content}"?`)) return;

    try {
      const { error } = await supabase
        .from('basic_learning')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Item deleted successfully" });
      fetchBasicLearningItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !user || !isTeacher) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setCsvLoading(true);
    try {
      const text = await csvFile.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      let createdCount = 0;

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV line properly handling quoted values
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        
        if (values.length < 3) continue;

        const [gujaratiWord, englishWord, usageExample] = values;
        
        if (!gujaratiWord || !englishWord || !usageExample) continue;

        const { error } = await supabase
          .from('basic_learning')
          .insert({
            content_type: 'basic_word',
            gujarati_content: gujaratiWord,
            english_content: englishWord,
            transliteration: usageExample,
            difficulty_level: 1,
            created_by: user.id
          });

        if (!error) {
          createdCount++;
        }
      }

      toast({
        title: "Success",
        description: `${createdCount} basic words uploaded successfully!`
      });

      setCsvFile(null);
      setShowCsvUploader(false);
      fetchBasicLearningItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCsvLoading(false);
    }
  };

  const navigateBasicWord = (direction: 'prev' | 'next') => {
    const basicWords = basicItems.filter(item => item.content_type === 'basic_word');
    let newIndex;
    if (direction === 'next') {
      newIndex = currentWordIndex < basicWords.length - 1 ? currentWordIndex + 1 : 0;
      // Mark current word as learned when moving to next
      if (basicWords[currentWordIndex]) {
        markItemLearned(true);
      }
    } else {
      newIndex = currentWordIndex > 0 ? currentWordIndex - 1 : basicWords.length - 1;
    }
    setCurrentWordIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading basic learning content...</div>
      </div>
    );
  }

  if (basicItems.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">Basic Learning</h1>
          <p className="text-muted-foreground">No {getTabTitle(activeTab).toLowerCase()} available yet!</p>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alphabet">અક્ષરો</TabsTrigger>
              <TabsTrigger value="number">સંખ્યાઓ</TabsTrigger>
              <TabsTrigger value="basic_word">મૂળભૂત શબ્દો</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    );
  }

  const currentItem = basicItems[currentIndex];
  const currentProgress = learningProgress.find(p => p.content_id === currentItem?.id);

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Basic Learning</h1>
          <div className="flex gap-2 items-center">
          {isTeacher && (
            <div className="flex gap-2">
              <Button onClick={handleAddNew} size="sm" className="gap-2">
                <Plus size={16} />
                Add New
              </Button>
              {activeTab === 'basic_word' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCsvUploader(!showCsvUploader)} 
                  size="sm" 
                  className="gap-2"
                >
                  <Upload size={16} />
                  Upload CSV
                </Button>
              )}
            </div>
          )}
            <Badge variant="secondary">
              {currentIndex + 1} / {basicItems.length}
            </Badge>
            <Badge variant={currentProgress?.is_learned ? "default" : "outline"}>
              {currentProgress?.is_learned ? "Learned" : "Learning"}
            </Badge>
          </div>
        </div>

        {/* CSV Uploader for Basic Words */}
        {isTeacher && showCsvUploader && activeTab === 'basic_word' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Basic Words CSV
              </CardTitle>
              <CardDescription>
                Upload basic Gujarati words with English meanings and usage examples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Columns (in exact order):</strong></p>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Gujarati Word</li>
                    <li>English Word</li>
                    <li>Usage Example</li>
                  </ol>
                  <p className="mt-3"><strong>Example Format:</strong></p>
                  <code className="block bg-background p-2 rounded text-xs mt-2">
                    પાણી,Water,"પાણી જીવન માટે જરૂરી છે."
                  </code>
                </div>
              </div>

              <div>
                <Label htmlFor="basic-csv-file">Select CSV File</Label>
                <Input
                  id="basic-csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  disabled={csvLoading}
                />
              </div>

              {csvFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="text-sm">{csvFile.name}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleCsvUpload} disabled={csvLoading || !csvFile}>
                  {csvLoading ? 'Uploading...' : 'Upload CSV'}
                </Button>
                <Button variant="outline" onClick={() => setShowCsvUploader(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alphabet">અક્ષરો (Alphabets)</TabsTrigger>
            <TabsTrigger value="number">સંખ્યાઓ (Numbers)</TabsTrigger>
            <TabsTrigger value="basic_word">મૂળભૂત શબ્દો (Basic Words)</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {activeTab === 'alphabet' || activeTab === 'number' ? (
              // Grid layout for alphabets and numbers
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {activeTab === 'alphabet' ? 'Gujarati Alphabets' : 'Gujarati Numbers'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'alphabet' 
                      ? 'Learn all Gujarati letters with pronunciation'
                      : 'Learn numbers 1-100 in Gujarati with pronunciation'
                    }
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => basicItems.forEach((item, index) => {
                      setTimeout(() => playAudio(item.gujarati_content), index * 500);
                    })}
                    className="gap-2 mb-6"
                  >
                    <Volume2 size={16} />
                    {activeTab === 'alphabet' ? 'Play All Alphabets' : 'Play All Numbers'}
                  </Button>
                </div>
                
                <div className="space-y-8">
                  {activeTab === 'alphabet' ? (
                    <>
                      {/* Vowels Section */}
                      <div>
                        <h3 className="text-xl font-semibold text-primary mb-4 text-center">
                          સ્વર (Vowels)
                        </h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                          {basicItems.filter(item => item.order_sequence <= 13).map((item) => {
                            const progress = learningProgress.find(p => p.content_id === item.id);
                            return (
                            <div key={item.id} className={`flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors relative group ${progress?.is_learned ? 'bg-green-50 border-green-200' : ''}`}>
                              {isTeacher && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="w-6 h-6 p-0"
                                  >
                                    <Edit size={10} />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    className="w-6 h-6 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 size={10} />
                                  </Button>
                                </div>
                              )}
                              <div className="text-4xl font-bold text-primary mb-2">
                                {item.gujarati_content}
                              </div>
                              <div className="text-sm text-secondary mb-2">
                                {item.english_content}
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                ({item.transliteration})
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => playAudio(item.gujarati_content)}
                                className="w-8 h-8 p-0"
                              >
                                <Volume2 size={12} />
                              </Button>
                            </div>
                          );
                        })}
                        </div>
                      </div>

                      {/* Consonants Section */}
                      <div>
                        <h3 className="text-xl font-semibold text-primary mb-4 text-center">
                          વ્યંજન (Consonants)
                        </h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                          {basicItems.filter(item => item.order_sequence > 13).map((item) => {
                            const progress = learningProgress.find(p => p.content_id === item.id);
                            return (
                              <div key={item.id} className={`flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors relative group ${progress?.is_learned ? 'bg-green-50 border-green-200' : ''}`}>
                                {isTeacher && (
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(item)}
                                      className="w-6 h-6 p-0"
                                    >
                                      <Edit size={10} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(item)}
                                      className="w-6 h-6 p-0 text-red-500 hover:text-red-600"
                                    >
                                      <Trash2 size={10} />
                                    </Button>
                                  </div>
                                )}
                                <div className="text-5xl font-bold text-primary mb-2">
                                  {item.gujarati_content}
                                </div>
                                <div className="text-lg font-semibold text-secondary-foreground mb-2">
                                  {item.english_content}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => playAudio(item.gujarati_content)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Volume2 size={12} />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Numbers Grid Layout */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {basicItems.map((item) => {
                        const progress = learningProgress.find(p => p.content_id === item.id);
                        return (
                          <Card key={item.id} className={`relative group min-h-[160px] transition-colors ${progress?.is_learned ? 'bg-green-50 border-green-200' : ''}`}>
                            <CardContent className="p-4 h-full flex flex-col justify-between">
                              {isTeacher && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="w-6 h-6 p-0"
                                  >
                                    <Edit size={10} />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    className="w-6 h-6 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 size={10} />
                                  </Button>
                                </div>
                              )}
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
                                <div className="text-3xl font-bold text-primary break-words max-w-full leading-tight">
                                  {item.gujarati_content}
                                </div>
                                <div className="text-sm font-semibold text-secondary-foreground break-words max-w-full">
                                  {item.english_content}
                                </div>
                                {item.order_sequence && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.order_sequence}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 justify-center mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => playAudio(item.gujarati_content)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Volume2 size={12} />
                                </Button>
                                {progress?.is_learned ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentIndex(basicItems.findIndex(i => i.id === item.id));
                                      markItemLearned(false);
                                    }}
                                    className="w-8 h-8 p-0 text-orange-500"
                                    title="Mark as need practice"
                                  >
                                    <X size={12} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentIndex(basicItems.findIndex(i => i.id === item.id));
                                      markItemLearned(true);
                                    }}
                                    className="w-8 h-8 p-0 text-green-500"
                                    title="Mark as learned"
                                  >
                                    <Check size={12} />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Word Bank format for basic words
              <div className="max-w-3xl mx-auto">
                {(() => {
                  const basicWords = basicItems.filter(item => item.content_type === 'basic_word');
                  const currentWord = basicWords[currentWordIndex];
                  const currentProgress = learningProgress.find(p => p.content_id === currentWord?.id);
                  
                  if (!currentWord) {
                    return (
                      <Card className="text-center p-8">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No basic words available</h3>
                        <p className="text-muted-foreground mb-4">
                          {isTeacher ? 'Add some basic words to get started!' : 'Your teacher will add basic words soon.'}
                        </p>
                      </Card>
                    );
                  }

                  return (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-center flex-1">
                            મૂળભૂત શબ્દો (Basic Words)
                          </CardTitle>
                          <Badge variant="secondary">
                            {currentWordIndex + 1} / {basicWords.length}
                          </Badge>
                        </div>
                        <CardDescription className="text-center">
                          Learn essential Gujarati vocabulary with English meanings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Word Display in Word Bank Format */}
                        <div className="text-center space-y-4 p-8 bg-muted/30 rounded-lg">
                          <div className="text-4xl font-bold text-primary">
                            {currentWord.gujarati_content}
                          </div>
                          <div className="text-2xl text-muted-foreground">
                            ({currentWord.english_content})
                          </div>
                        </div>

                        {/* Usage Example */}
                        {currentWord.transliteration && (
                          <div className="space-y-4 p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                            <h4 className="font-semibold text-lg text-primary">Usage Example:</h4>
                            <div className="text-xl font-medium text-foreground">
                              {currentWord.transliteration}
                            </div>
                          </div>
                        )}

                        {/* Audio Control */}
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            onClick={() => playAudio(currentWord.gujarati_content)}
                            className="gap-2"
                          >
                            <Volume2 size={16} />
                            Play Audio
                          </Button>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-6">
                          <Button
                            variant="outline"
                            onClick={() => navigateBasicWord('prev')}
                            className="flex items-center gap-2 px-6 py-3"
                            size="lg"
                          >
                            <ChevronLeft className="w-5 h-5" />
                            Previous Word
                          </Button>
                          
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Difficulty Level</div>
                            <div className="text-lg font-semibold">{currentWord.difficulty_level}</div>
                            {currentProgress?.is_learned && (
                              <Badge variant="default" className="mt-1">Learned</Badge>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => navigateBasicWord('next')}
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
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit/Add Dialog */}
        <Dialog open={!!editingItem || isAddingNew} onOpenChange={() => {
          setEditingItem(null);
          setIsAddingNew(false);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add New'} {getTabTitle(activeTab).split(' ')[0]}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gujarati" className="text-right">Gujarati</Label>
                <Input
                  id="gujarati"
                  value={formData.gujarati_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, gujarati_content: e.target.value }))}
                  className="col-span-3"
                  placeholder="Enter Gujarati text"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="english" className="text-right">English</Label>
                <Input
                  id="english"
                  value={formData.english_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, english_content: e.target.value }))}
                  className="col-span-3"
                  placeholder="Enter English text"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transliteration" className="text-right">Transliteration</Label>
                <Input
                  id="transliteration"
                  value={formData.transliteration}
                  onChange={(e) => setFormData(prev => ({ ...prev, transliteration: e.target.value }))}
                  className="col-span-3"
                  placeholder="Enter transliteration"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="order" className="text-right">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order_sequence}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_sequence: e.target.value }))}
                  className="col-span-3"
                  placeholder="Order sequence"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Practice;