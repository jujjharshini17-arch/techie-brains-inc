-- ============================================================
-- TechieBrains: Convert Resume Status Column to Text
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vexemcdcxdrpefzwfwfx/sql/new
-- ============================================================

-- 1. Drop the default value constraint from the status column
alter table public.resumes alter column status drop default;

-- 2. Convert the column type to text
alter table public.resumes alter column status type text;

-- 3. Set the new default value to match the updated application state
alter table public.resumes alter column status set default 'Resume Under Review';

-- 4. Update any existing rows that have older status strings to matching new ones
update public.resumes set status = 'Resume Under Review' where status = 'Pending' or status = 'Under Review';
update public.resumes set status = 'Shortlisted' where status = 'Accepted';
update public.resumes set status = 'Application Not Selected' where status = 'Rejected';
