-- Remove duplicate entries from basic_learning table for numbers
-- Keep only the first entry for each number (by order_sequence)

-- Delete duplicates, keeping only the row with the minimum id for each combination
DELETE FROM basic_learning 
WHERE content_type = 'number' 
AND id NOT IN (
  SELECT MIN(id) 
  FROM basic_learning 
  WHERE content_type = 'number' 
  GROUP BY gujarati_content, english_content, order_sequence
);