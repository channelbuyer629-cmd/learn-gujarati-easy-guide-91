import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Plus, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WordBankUploaderProps {
  onSuccess: () => void;
}

export const WordBankUploader = ({ onSuccess }: WordBankUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'csv'>('manual');
  const [wordType, setWordType] = useState<'synonym' | 'antonym' | 'idiom'>('synonym');
  const [loading, setLoading] = useState(false);
  
  const [manualForm, setManualForm] = useState({
    gujarati_word: '',
    gujarati_content: '',
    english_meaning: '',
    usage_example_gujarati: '',
    usage_example_english: '',
    difficulty_level: 1
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleManualSubmit = async () => {
    if (!user || !manualForm.gujarati_word || !manualForm.gujarati_content || !manualForm.english_meaning || !manualForm.usage_example_gujarati || !manualForm.usage_example_english) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let insertData: any = {
        gujarati_word: manualForm.gujarati_word,
        english_meaning: manualForm.english_meaning,
        usage_example_gujarati: manualForm.usage_example_gujarati,
        usage_example_english: manualForm.usage_example_english,
        difficulty_level: manualForm.difficulty_level,
        created_by: user.id
      };

      // Add the specific content field based on word type
      if (wordType === 'synonym') {
        insertData.gujarati_synonyms = manualForm.gujarati_content;
      } else if (wordType === 'antonym') {
        insertData.gujarati_antonyms = manualForm.gujarati_content;
      } else if (wordType === 'idiom') {
        insertData.gujarati_idioms = manualForm.gujarati_content;
      }

      const tableName = wordType === 'synonym' ? 'synonyms' : 
                      wordType === 'antonym' ? 'antonyms' : 'idioms';

      const { error } = await supabase
        .from(tableName)
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${wordType} added successfully!`
      });

      setManualForm({
        gujarati_word: '',
        gujarati_content: '',
        english_meaning: '',
        usage_example_gujarati: '',
        usage_example_english: '',
        difficulty_level: 1
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !user) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const text = await csvFile.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      let createdCount = 0;
      const tableName = wordType === 'synonym' ? 'synonyms' : 
                      wordType === 'antonym' ? 'antonyms' : 'idioms';

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
        values.push(currentValue.trim()); // Add the last value
        
        if (values.length < 5) continue;

        const [gujaratiWord, gujaratiContent, englishMeaning, usageGujarati, usageEnglish] = values;
        
        if (!gujaratiWord || !gujaratiContent || !englishMeaning || !usageGujarati || !usageEnglish) continue;

        let insertData: any = {
          gujarati_word: gujaratiWord,
          english_meaning: englishMeaning,
          usage_example_gujarati: usageGujarati,
          usage_example_english: usageEnglish,
          difficulty_level: 1, // Default difficulty level since not provided in CSV
          created_by: user.id
        };

        // Add the specific content field based on word type
        if (wordType === 'synonym') {
          insertData.gujarati_synonyms = gujaratiContent;
        } else if (wordType === 'antonym') {
          insertData.gujarati_antonyms = gujaratiContent;
        } else if (wordType === 'idiom') {
          insertData.gujarati_idioms = gujaratiContent;
        }

        const { error } = await supabase
          .from(tableName)
          .insert(insertData);

        if (!error) {
          createdCount++;
        }
      }

      toast({
        title: "Success",
        description: `${createdCount} ${wordType}s uploaded successfully!`
      });

      setCsvFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getContentLabel = () => {
    switch (wordType) {
      case 'synonym': return 'Synonyms (Gujarati only)';
      case 'antonym': return 'Antonyms (Gujarati only)';
      case 'idiom': return 'Idiom Meaning (Gujarati only)';
      default: return 'Content';
    }
  };

  const getContentPlaceholder = () => {
    switch (wordType) {
      case 'synonym': return 'સુંદર, મનોહર, આકર્ષક';
      case 'antonym': return 'દિવસ ↔ રાત';
      case 'idiom': return 'આંખનો તારો';
      default: return '';
    }
  };

  const getWordTypeDisplay = (type: string) => {
    switch (type) {
      case 'synonym': return 'પર્યાયવાચી (Synonyms)';
      case 'antonym': return 'વિલોમ (Antonyms)';
      case 'idiom': return 'મહાવરો (Idioms)';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Word Bank Content
        </CardTitle>
        <CardDescription>
          Add synonyms, antonyms, and idioms to separate datasets for organized learning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Important Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Data Separation:</strong> Content will be stored in separate datasets to ensure clean organization. 
            Synonyms go to synonyms table, antonyms to antonyms table, and idioms to idioms table.
          </AlertDescription>
        </Alert>

        {/* Word Type Selection */}
        <div>
          <Label>Content Type</Label>
          <Select value={wordType} onValueChange={(value: any) => setWordType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="synonym">પર્યાયવાચી (Synonyms)</SelectItem>
              <SelectItem value="antonym">વિલોમ (Antonyms)</SelectItem>
              <SelectItem value="idiom">મહાવરો (Idioms)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Upload Method Tabs */}
        <Tabs value={uploadMethod} onValueChange={(value: any) => setUploadMethod(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gujarati-word">Gujarati Word *</Label>
                <Input
                  id="gujarati-word"
                  value={manualForm.gujarati_word}
                  onChange={(e) => setManualForm(prev => ({ ...prev, gujarati_word: e.target.value }))}
                  placeholder="સુંદર"
                  required
                />
              </div>
              <div>
                <Label htmlFor="gujarati-content">{getContentLabel()} *</Label>
                <Input
                  id="gujarati-content"
                  value={manualForm.gujarati_content}
                  onChange={(e) => setManualForm(prev => ({ ...prev, gujarati_content: e.target.value }))}
                  placeholder={getContentPlaceholder()}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="english-meaning">English Meaning *</Label>
              <Input
                id="english-meaning"
                value={manualForm.english_meaning}
                onChange={(e) => setManualForm(prev => ({ ...prev, english_meaning: e.target.value }))}
                placeholder="Beautiful, attractive, lovely"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usage-gujarati">Usage Example (Gujarati) *</Label>
                <Textarea
                  id="usage-gujarati"
                  value={manualForm.usage_example_gujarati}
                  onChange={(e) => setManualForm(prev => ({ ...prev, usage_example_gujarati: e.target.value }))}
                  placeholder="આ ફૂલ ખૂબ સુંદર છે."
                  required
                />
              </div>
              <div>
                <Label htmlFor="usage-english">Usage Example (English) *</Label>
                <Textarea
                  id="usage-english"
                  value={manualForm.usage_example_english}
                  onChange={(e) => setManualForm(prev => ({ ...prev, usage_example_english: e.target.value }))}
                  placeholder="This flower is very beautiful."
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={manualForm.difficulty_level.toString()}
                onValueChange={(value) => setManualForm(prev => ({ ...prev, difficulty_level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Beginner</SelectItem>
                  <SelectItem value="2">2 - Intermediate</SelectItem>
                  <SelectItem value="3">3 - Advanced</SelectItem>
                  <SelectItem value="4">4 - Expert</SelectItem>
                  <SelectItem value="5">5 - Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleManualSubmit} disabled={loading} className="w-full">
              {loading ? 'Adding...' : `Add ${getWordTypeDisplay(wordType)}`}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Columns (in exact order):</strong></p>
                {wordType === 'synonym' && (
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Gujarati Word</li>
                    <li>Synonyms (Gujarati)</li>
                    <li>English Meaning</li>
                    <li>Usage Example (Gujarati)</li>
                    <li>Usage Example (English)</li>
                  </ol>
                )}
                {wordType === 'antonym' && (
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Gujarati Word</li>
                    <li>Antonym (Gujarati)</li>
                    <li>English Meaning</li>
                    <li>Usage Example (Gujarati)</li>
                    <li>Usage Example (English)</li>
                  </ol>
                )}
                {wordType === 'idiom' && (
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Gujarati Idiom</li>
                    <li>Meaning (Gujarati)</li>
                    <li>English Meaning</li>
                    <li>Usage Example (Gujarati)</li>
                    <li>Usage Example (English)</li>
                  </ol>
                )}
                <p className="mt-3"><strong>Example Format:</strong></p>
                {wordType === 'synonym' && (
                  <code className="block bg-background p-2 rounded text-xs mt-2">
                    ઝડપ,"ત્વરિત, વહેલો, ફાસ્ટ","Speed, Quickness",તે ઝડપથી દોડે છે.,He runs fast.
                  </code>
                )}
                {wordType === 'antonym' && (
                  <code className="block bg-background p-2 rounded text-xs mt-2">
                    મોટું,નાનું,Big ↔ Small,"આ ઘર મોટું છે, પણ તેની બાજુનું નાનું છે.","This house is big, but the one next to it is small."
                  </code>
                )}
                {wordType === 'idiom' && (
                  <code className="block bg-background p-2 rounded text-xs mt-2">
                    આંખ ઉઘાડવી,"જાગૃત થવું, સાવધાન થવું","Open eyes, Be alert",પરીક્ષામાં નિષ્ફળતા પછી તેની આંખ ઉઘડી.,He opened his eyes after failing the exam.
                  </code>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/gujarati_${wordType === 'synonym' ? 'synonyms' : wordType === 'antonym' ? 'antonyms' : 'idioms'}_example.csv`;
                      link.download = `gujarati_${wordType === 'synonym' ? 'synonyms' : wordType === 'antonym' ? 'antonyms' : 'idioms'}_example.csv`;
                      link.click();
                    }}
                  >
                    Download Example CSV
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </div>

            {csvFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-sm">{csvFile.name}</span>
              </div>
            )}

            <Button onClick={handleCsvUpload} disabled={loading || !csvFile} className="w-full">
              {loading ? 'Uploading...' : `Upload ${getWordTypeDisplay(wordType)} CSV`}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};