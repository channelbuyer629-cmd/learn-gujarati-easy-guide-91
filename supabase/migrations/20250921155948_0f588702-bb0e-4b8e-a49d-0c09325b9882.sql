-- Remove duplicate entries from basic_learning table for numbers
-- Use row_number() to identify duplicates and keep only the first one

WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY gujarati_content, english_content, order_sequence 
           ORDER BY created_at
         ) as row_num
  FROM basic_learning 
  WHERE content_type = 'number'
)
DELETE FROM basic_learning 
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);