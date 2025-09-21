import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Volume2, Check, X, Edit, Plus, Trash2 } from 'lucide-react';
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
              <Button onClick={handleAddNew} size="sm" className="gap-2">
                <Plus size={16} />
                Add New
              </Button>
            )}
            <Badge variant="secondary">
              {currentIndex + 1} / {basicItems.length}
            </Badge>
            <Badge variant={currentProgress?.is_learned ? "default" : "outline"}>
              {currentProgress?.is_learned ? "Learned" : "Learning"}
            </Badge>
          </div>
        </div>

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
                    </>
                  ) : (
                    /* Numbers Grid Layout */
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {basicItems.map((item) => {
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
                            <div className="flex items-center justify-center gap-3 mb-3">
                              <div className="text-5xl font-bold text-foreground">
                                {item.english_content}
                              </div>
                              <div className="text-5xl font-bold text-foreground">
                                {item.gujarati_content}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Flashcard layout for basic words
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">
                    {showAnswer ? "Learn & Practice" : getTabTitle(activeTab)}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {showAnswer ? "Practice pronunciation" : 'Learn words'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="text-6xl font-bold text-primary min-h-[120px] flex items-center justify-center">
                    {showAnswer ? (
                      <div className="space-y-4">
                        <div className="text-8xl">{currentItem?.gujarati_content}</div>
                        <div className="text-3xl text-secondary">
                          {currentItem?.english_content}
                        </div>
                        {currentItem?.transliteration && (
                          <div className="text-xl text-muted-foreground">
                            ({currentItem.transliteration})
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>{currentItem?.english_content}</div>
                        <div className="text-2xl text-muted-foreground">
                          What is this in Gujarati?
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    {!showAnswer ? (
                      <Button onClick={() => setShowAnswer(true)} size="lg">
                        <BookOpen size={20} className="mr-2" />
                        Show Answer
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playAudio(currentItem?.gujarati_content || '')}
                          className="gap-2"
                        >
                          <Volume2 size={16} />
                          Play Audio
                        </Button>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => markItemLearned(false)}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                          >
                            <X size={20} />
                            Need Practice
                          </Button>
                          <Button
                            onClick={() => markItemLearned(true)}
                            size="lg"
                            className="gap-2"
                          >
                            <Check size={20} />
                            Got It!
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
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