-- Remove duplicate alphabets, keeping only the most recent entry for each unique combination
DELETE FROM basic_learning 
WHERE id NOT IN (
  SELECT DISTINCT ON (gujarati_content, order_sequence) id
  FROM basic_learning 
  WHERE content_type = 'alphabet'
  ORDER BY gujarati_content, order_sequence, created_at DESC
);