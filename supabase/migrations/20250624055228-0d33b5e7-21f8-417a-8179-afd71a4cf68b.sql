
-- First, delete live chat messages for chats associated with temporary employee assignments
DELETE FROM public.live_chat_messages 
WHERE chat_id IN (
  SELECT lc.id FROM public.live_chats lc
  JOIN public.auftrag_assignments aa ON lc.assignment_id = aa.id
  WHERE aa.assigned_user_id IS NULL
);

-- Then delete live chats associated with temporary employee assignments
DELETE FROM public.live_chats 
WHERE assignment_id IN (
  SELECT id FROM public.auftrag_assignments 
  WHERE assigned_user_id IS NULL
);

-- Delete employee activity logs that reference evaluations from temporary employees
DELETE FROM public.employee_activity_logs 
WHERE evaluation_id IN (
  SELECT e.id FROM public.evaluations e
  JOIN public.auftrag_assignments aa ON e.assignment_id = aa.id
  WHERE aa.assigned_user_id IS NULL
);

-- Delete employee activity logs that reference assignments from temporary employees
DELETE FROM public.employee_activity_logs 
WHERE assignment_id IN (
  SELECT id FROM public.auftrag_assignments 
  WHERE assigned_user_id IS NULL
);

-- Delete evaluations from assignments without assigned_user_id (temporary employees)
DELETE FROM public.evaluations 
WHERE assignment_id IN (
  SELECT id FROM public.auftrag_assignments 
  WHERE assigned_user_id IS NULL
);

-- Finally delete assignments without assigned_user_id (temporary employees)
DELETE FROM public.auftrag_assignments 
WHERE assigned_user_id IS NULL;
