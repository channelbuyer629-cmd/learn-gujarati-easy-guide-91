import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen, Search } from 'lucide-react';

interface VocabularyItem {
  id: string;
  english_word: string;
  gujarati_word: string;
  gujarati_transliteration?: string;
  difficulty_level: number;
  category_id?: string;
  audio_url?: string;
  image_url?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export const VocabularyManager = () => {
  const { user, profile } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newWord, setNewWord] = useState({
    english_word: '',
    gujarati_word: '',
    gujarati_transliteration: '',
    difficulty_level: 1,
    category_id: ''
  });

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchVocabulary();
    fetchCategories();
  }, [selectedCategory]);

  const fetchVocabulary = async () => {
    try {
      let query = supabase
        .from('vocabulary')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      setVocabulary(data || []);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      toast.error('Failed to load vocabulary');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateWord = async () => {
    if (!newWord.english_word || !newWord.gujarati_word) {
      toast.error('Please fill in both English and Gujarati words');
      return;
    }

    try {
      const { error } = await supabase
        .from('vocabulary')
        .insert([{
          ...newWord,
          created_by: user?.id,
          category_id: newWord.category_id || null
        }]);

      if (error) throw error;

      toast.success('Vocabulary word added successfully!');
      setNewWord({
        english_word: '',
        gujarati_word: '',
        gujarati_transliteration: '',
        difficulty_level: 1,
        category_id: ''
      });
      setIsCreating(false);
      fetchVocabulary();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Word deleted successfully!');
      fetchVocabulary();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredVocabulary = vocabulary.filter(word =>
    word.english_word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.gujarati_word.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const levels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level] || 'Unknown';
  };

  if (loading) {
    return <div className="text-center p-6">Loading vocabulary...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Vocabulary Management
        </h2>
        {isTeacher && (
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Word
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Create Word Form */}
      {isCreating && isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Vocabulary Word</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="english">English Word</Label>
                <Input
                  id="english"
                  value={newWord.english_word}
                  onChange={(e) => setNewWord({ ...newWord, english_word: e.target.value })}
                  placeholder="Enter English word"
                />
              </div>
              <div>
                <Label htmlFor="gujarati">Gujarati Word</Label>
                <Input
                  id="gujarati"
                  value={newWord.gujarati_word}
                  onChange={(e) => setNewWord({ ...newWord, gujarati_word: e.target.value })}
                  placeholder="ગુજરાતી શબ્દ દાખલ કરો"
                />
              </div>
              <div>
                <Label htmlFor="transliteration">Transliteration (Optional)</Label>
                <Input
                  id="transliteration"
                  value={newWord.gujarati_transliteration}
                  onChange={(e) => setNewWord({ ...newWord, gujarati_transliteration: e.target.value })}
                  placeholder="gujarati shabd"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={newWord.difficulty_level.toString()}
                  onValueChange={(value) => setNewWord({ ...newWord, difficulty_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Elementary</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select
                  value={newWord.category_id}
                  onValueChange={(value) => setNewWord({ ...newWord, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateWord}>Add Word</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vocabulary List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVocabulary.map((word) => (
          <Card key={word.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{word.english_word}</CardTitle>
                  <p className="text-2xl text-primary mt-1">{word.gujarati_word}</p>
                  {word.gujarati_transliteration && (
                    <p className="text-sm text-muted-foreground italic">
                      ({word.gujarati_transliteration})
                    </p>
                  )}
                </div>
                {isTeacher && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWord(word.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Badge className={getDifficultyColor(word.difficulty_level)}>
                  {getDifficultyText(word.difficulty_level)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(word.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVocabulary.length === 0 && (
        <Card className="text-center p-8">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No vocabulary found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "No words match your search criteria." 
              : "No vocabulary words have been added yet."}
          </p>
          {isTeacher && !searchTerm && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Word
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};