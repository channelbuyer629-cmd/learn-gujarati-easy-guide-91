/*
  # Create separate tables for synonyms, antonyms, and idioms

  1. New Tables
    - `synonyms`
      - `id` (uuid, primary key)
      - `gujarati_word` (text)
      - `gujarati_synonyms` (text)
      - `english_meaning` (text)
      - `usage_example_gujarati` (text)
      - `usage_example_english` (text)
      - `difficulty_level` (integer)
      - `created_by` (uuid)
      - `created_at` (timestamp)
    - `antonyms`
      - Same structure as synonyms but for antonyms
    - `idioms`
      - Same structure as synonyms but for idioms
    - `word_progress`
      - Tracks student progress for each word type separately

  2. Security
    - Enable RLS on all new tables
    - Add policies for students and teachers
*/

-- Create synonyms table
CREATE TABLE IF NOT EXISTS synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gujarati_word text NOT NULL,
  gujarati_synonyms text NOT NULL,
  english_meaning text NOT NULL,
  usage_example_gujarati text NOT NULL,
  usage_example_english text NOT NULL,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create antonyms table
CREATE TABLE IF NOT EXISTS antonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gujarati_word text NOT NULL,
  gujarati_antonyms text NOT NULL,
  english_meaning text NOT NULL,
  usage_example_gujarati text NOT NULL,
  usage_example_english text NOT NULL,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create idioms table
CREATE TABLE IF NOT EXISTS idioms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gujarati_word text NOT NULL,
  gujarati_idioms text NOT NULL,
  english_meaning text NOT NULL,
  usage_example_gujarati text NOT NULL,
  usage_example_english text NOT NULL,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create word progress tracking table
CREATE TABLE IF NOT EXISTS word_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  word_type text NOT NULL CHECK (word_type IN ('synonym', 'antonym', 'idiom')),
  word_id uuid NOT NULL,
  is_learned boolean DEFAULT false,
  times_reviewed integer DEFAULT 0,
  last_reviewed timestamptz,
  learned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, word_type, word_id)
);

-- Enable RLS
ALTER TABLE synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE antonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE idioms ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;

-- Policies for synonyms
CREATE POLICY "Everyone can view synonyms"
  ON synonyms
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Teachers can create synonyms"
  ON synonyms
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update synonyms"
  ON synonyms
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete synonyms"
  ON synonyms
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Policies for antonyms (same as synonyms)
CREATE POLICY "Everyone can view antonyms"
  ON antonyms
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Teachers can create antonyms"
  ON antonyms
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update antonyms"
  ON antonyms
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete antonyms"
  ON antonyms
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Policies for idioms (same as synonyms)
CREATE POLICY "Everyone can view idioms"
  ON idioms
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Teachers can create idioms"
  ON idioms
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update idioms"
  ON idioms
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete idioms"
  ON idioms
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Policies for word_progress
CREATE POLICY "Users can view their own word progress"
  ON word_progress
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own word progress"
  ON word_progress
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own word progress"
  ON word_progress
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all word progress"
  ON word_progress
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Insert some sample data
INSERT INTO synonyms (gujarati_word, gujarati_synonyms, english_meaning, usage_example_gujarati, usage_example_english, difficulty_level) VALUES
('સુંદર', 'સુંદર, મનોહર, આકર્ષક, સુશોભિત', 'Beautiful, attractive, lovely', 'આ ફૂલ ખૂબ સુંદર છે.', 'This flower is very beautiful.', 1),
('મોટું', 'મોટું, વિશાળ, વિસ્તૃત, વિશાળકાય', 'Big, large, huge, enormous', 'આ મકાન ખૂબ મોટું છે.', 'This house is very big.', 1),
('ખુશી', 'ખુશી, આનંદ, હર્ષ, પ્રસન્નતા', 'Happiness, joy, delight, pleasure', 'તેના ચહેરા પર ખુશી દેખાતી હતી.', 'Happiness was visible on his face.', 2);

INSERT INTO antonyms (gujarati_word, gujarati_antonyms, english_meaning, usage_example_gujarati, usage_example_english, difficulty_level) VALUES
('દિવસ', 'દિવસ ↔ રાત', 'Day (opposite: Night)', 'દિવસે કામ કરો અને રાતે આરામ કરો.', 'Work during the day and rest at night.', 1),
('ગરમ', 'ગરમ ↔ ઠંડું', 'Hot (opposite: Cold)', 'ગરમ પાણી પીવું સારું છે, ઠંડું નહીં.', 'Drinking hot water is good, not cold.', 1),
('ઉંચું', 'ઉંચું ↔ નીચું', 'High (opposite: Low)', 'પર્વત ઉંચો હોય છે અને ખીણ નીચી હોય છે.', 'Mountains are high and valleys are low.', 2);

INSERT INTO idioms (gujarati_word, gujarati_idioms, english_meaning, usage_example_gujarati, usage_example_english, difficulty_level) VALUES
('આંખનો તારો', 'આંખનો તારો', 'Apple of one\'s eye (very dear person)', 'તે તેના માતા-પિતાનો આંખનો તારો છે.', 'He is the apple of his parents\' eyes.', 3),
('હાથ પર હાથ રાખીને બેસવું', 'હાથ પર હાથ રાખીને બેસવું', 'To sit idle, to do nothing', 'કામ છે તો હાથ પર હાથ રાખીને કેમ બેસો છો?', 'There is work to do, why are you sitting idle?', 3),
('પાણીમાં પાણી મળવું', 'પાણીમાં પાણી મળવું', 'To blend perfectly, to mix well', 'તેઓ બંને મિત્રો પાણીમાં પાણીની જેમ મળે છે.', 'Those two friends blend together like water in water.', 4);