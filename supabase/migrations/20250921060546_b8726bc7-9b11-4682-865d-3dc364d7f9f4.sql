-- Create separate tables for synonyms, antonyms, and idioms
CREATE TABLE public.synonyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gujarati_word TEXT NOT NULL,
  gujarati_synonyms TEXT NOT NULL,
  english_meaning TEXT NOT NULL,
  usage_example_gujarati TEXT NOT NULL,
  usage_example_english TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.antonyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gujarati_word TEXT NOT NULL,
  gujarati_antonyms TEXT NOT NULL,
  english_meaning TEXT NOT NULL,
  usage_example_gujarati TEXT NOT NULL,
  usage_example_english TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.idioms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gujarati_word TEXT NOT NULL,
  gujarati_idioms TEXT NOT NULL,
  english_meaning TEXT NOT NULL,
  usage_example_gujarati TEXT NOT NULL,
  usage_example_english TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create word progress tracking table
CREATE TABLE public.word_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word_id UUID NOT NULL,
  word_type TEXT NOT NULL CHECK (word_type IN ('synonym', 'antonym', 'idiom')),
  is_learned BOOLEAN DEFAULT false,
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  learned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word_id, word_type)
);

-- Enable RLS on all tables
ALTER TABLE public.synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idioms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for synonyms
CREATE POLICY "Everyone can view synonyms" ON public.synonyms FOR SELECT USING (true);
CREATE POLICY "Teachers can create synonyms" ON public.synonyms FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can update synonyms" ON public.synonyms FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can delete synonyms" ON public.synonyms FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));

-- RLS policies for antonyms
CREATE POLICY "Everyone can view antonyms" ON public.antonyms FOR SELECT USING (true);
CREATE POLICY "Teachers can create antonyms" ON public.antonyms FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can update antonyms" ON public.antonyms FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can delete antonyms" ON public.antonyms FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));

-- RLS policies for idioms
CREATE POLICY "Everyone can view idioms" ON public.idioms FOR SELECT USING (true);
CREATE POLICY "Teachers can create idioms" ON public.idioms FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can update idioms" ON public.idioms FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can delete idioms" ON public.idioms FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));

-- RLS policies for word_progress
CREATE POLICY "Users can view their own word progress" ON public.word_progress FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own word progress" ON public.word_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own word progress" ON public.word_progress FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all word progress" ON public.word_progress FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));

-- Create triggers for updated_at
CREATE TRIGGER update_synonyms_updated_at BEFORE UPDATE ON public.synonyms 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_antonyms_updated_at BEFORE UPDATE ON public.antonyms 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_idioms_updated_at BEFORE UPDATE ON public.idioms 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_word_progress_updated_at BEFORE UPDATE ON public.word_progress 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();