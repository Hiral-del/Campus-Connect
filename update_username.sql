-- Update Aarav's username to Ananya's username
UPDATE users 
SET username = 'ananya0' 
WHERE username = 'aarav0';

-- Add more high marks for Ananya (student_id of the former aarav0)
-- Let's find her ID first
INSERT INTO marks (student_id, subject_id, score, exam_type)
SELECT s.id, sub.id, 98, 'Final'
FROM students s
CROSS JOIN subjects sub
WHERE s.name = 'Ananya Sharma'
LIMIT 5; -- Add 5 more high marks for different subjects
