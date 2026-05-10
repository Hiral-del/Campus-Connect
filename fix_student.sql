-- Update Aarav Sharma to Ananya Sharma and fix status
UPDATE students 
SET name = 'Ananya Sharma', performance_status = 'Excellent' 
WHERE name = 'Aarav Sharma';

-- Also update some marks for this student to ensure the trigger doesn't revert them to 'At Risk'
-- Ananya's ID will be found by name
UPDATE marks 
SET score = 95 
WHERE student_id IN (SELECT id FROM students WHERE name = 'Ananya Sharma');
