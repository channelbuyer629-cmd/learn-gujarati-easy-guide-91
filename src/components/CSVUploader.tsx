import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CSVUploaderProps {
  onSuccess?: () => void;
  uploadType?: 'quiz' | 'vocabulary' | 'dialogue' | 'word_bank' | 'basic_learning' | 'games';
  title?: string;
  description?: string;
}

export const CSVUploader = ({ 
  onSuccess, 
  uploadType = 'vocabulary',
  title = 'Upload CSV',
  description = 'Upload a CSV file to bulk create content'
}: CSVUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadComplete(false);
        setCreatedCount(0);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        });
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadComplete(false);
    setCreatedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      // Simple CSV parsing - handle quotes
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      return values.map(val => val.replace(/^"|"$/g, ''));
    });
  };

  const handleVocabularyUpload = async (parsedData: string[][]) => {
    let createdCount = 0;
    
    for (const values of parsedData.slice(1)) { // Skip header
      if (values.length < 2) continue;
      
      const englishWord = values[0]?.trim();
      const gujaratiWord = values[1]?.trim();
      const transliteration = values[2]?.trim() || '';
      const difficultyLevel = parseInt(values[3]) || 1;
      
      if (!englishWord || !gujaratiWord) continue;
      
      const { data: existing } = await supabase
        .from('vocabulary')
        .select('id')
        .eq('english_word', englishWord)
        .eq('gujarati_word', gujaratiWord)
        .maybeSingle();
      
      if (!existing) {
        const { error } = await supabase
          .from('vocabulary')
          .insert({
            english_word: englishWord,
            gujarati_word: gujaratiWord,
            gujarati_transliteration: transliteration,
            difficulty_level: difficultyLevel,
            created_by: user!.id
          });
          
        if (!error) {
          createdCount++;
        } else {
          console.error('Error inserting vocabulary:', error);
        }
      }
    }
    
    setUploading(false);
    setCreatedCount(createdCount);
    setUploadComplete(true);
    
    if (createdCount > 0) {
      onSuccess?.();
    }
  };

  const handleQuizUpload = async (parsedData: string[][]) => {
    const quizGroups: Record<string, any[]> = {};
    let createdCount = 0;
    
    for (const values of parsedData.slice(1)) { // Skip header
      if (values.length < 10) continue;
      
      const title = values[0] || 'Imported Quiz';
      const questionGujarati = values[3];
      const questionEnglish = values[4];
      const options = [values[5], values[6], values[7], values[8]];
      const correctAnswer = values[9];
      
      if (!questionGujarati || !questionEnglish) continue;
      
      if (!quizGroups[title]) {
        quizGroups[title] = [];
      }
      
      quizGroups[title].push({
        question: `${questionGujarati} / ${questionEnglish}`,
        question_gujarati: questionGujarati,
        options: options.filter(opt => opt && opt.length > 0),
        correct_answer: correctAnswer,
        explanation: ''
      });
    }
    
    for (const [title, questions] of Object.entries(quizGroups)) {
      if (questions.length === 0) continue;
      
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('title', title)
        .eq('created_by', user!.id)
        .maybeSingle();
      
      if (!existingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .insert({
            title,
            description: `${title} - Imported from CSV with ${questions.length} questions`,
            quiz_type: 'game',
            difficulty_level: 2,
            time_limit: 15,
            questions: questions as any,
            created_by: user!.id
          });
          
        if (!error) {
          createdCount++;
        }
      }
    }
    
    setUploading(false);
    setCreatedCount(createdCount);
    setUploadComplete(true);
    
    if (createdCount > 0) {
      onSuccess?.();
    }
  };

  const handleDialogueUpload = async (parsedData: string[][]) => {
    const dialogueGroups: Record<string, any[]> = {};
    let createdCount = 0;
    
    for (const values of parsedData.slice(1)) { // Skip header
      if (values.length < 4) continue;
      
      const title = values[0] || 'Imported Dialogue';
      const speaker = values[1];
      const english = values[2];
      const gujarati = values[3];
      const transliteration = values[4] || '';
      
      if (!speaker || !english || !gujarati) continue;
      
      if (!dialogueGroups[title]) {
        dialogueGroups[title] = [];
      }
      
      dialogueGroups[title].push({
        speaker,
        english,
        gujarati,
        transliteration
      });
    }
    
    for (const [title, dialogueData] of Object.entries(dialogueGroups)) {
      if (dialogueData.length === 0) continue;
      
      const { error } = await supabase
        .from('dialogues')
        .insert({
          title,
          description: `${title} - Imported from CSV with ${dialogueData.length} steps`,
          scenario: 'Imported conversation',
          dialogue_data: dialogueData as any,
          difficulty_level: 2,
          created_by: user!.id
        });
        
      if (!error) {
        createdCount++;
      }
    }
    
    setUploading(false);
    setCreatedCount(createdCount);
    setUploadComplete(true);
    
    if (createdCount > 0) {
      onSuccess?.();
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    
    setUploading(true);
    
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }
      
      switch (uploadType) {
        case 'vocabulary':
        case 'word_bank':
        case 'basic_learning':
          await handleVocabularyUpload(parsedData);
          break;
        case 'quiz':
        case 'games':
          await handleQuizUpload(parsedData);
          break;
        case 'dialogue':
          await handleDialogueUpload(parsedData);
          break;
        default:
          await handleVocabularyUpload(parsedData);
      }
      
      toast({
        title: "Upload successful",
        description: `${createdCount} items created successfully`,
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive"
      });
      setUploading(false);
    }
  };

  const getFormatInstructions = () => {
    switch (uploadType) {
      case 'vocabulary':
      case 'word_bank':
      case 'basic_learning':
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Format:</strong> english_word, gujarati_word, transliteration, difficulty_level</p>
            <p><strong>Example:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs">
              water,પાણી,paani,1<br/>
              book,પુસ્તક,pustak,2
            </code>
          </div>
        );
      case 'quiz':
      case 'games':
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Format:</strong> title, type, description, question_gujarati, question_english, option_a, option_b, option_c, option_d, correct_answer</p>
            <p><strong>Example:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs">
              Basic Quiz,game,Simple quiz,પાણી શું છે?,What is water?,H2O,પ્રવાહી,બંને,માત્ર A,C
            </code>
          </div>
        );
      case 'dialogue':
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Format:</strong> title, speaker, english, gujarati, transliteration</p>
            <p><strong>Example:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs">
              Meeting,Alice,Hello,નમસ્તે,namaste<br/>
              Meeting,Bob,How are you?,તમે કેવા છો?,tame keva cho?
            </code>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {getFormatInstructions()}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
          
          {file && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {uploadComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                Successfully created {createdCount} items
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </>
              )}
            </Button>
            
            {file && (
              <Button variant="outline" onClick={clearFile} disabled={uploading}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};