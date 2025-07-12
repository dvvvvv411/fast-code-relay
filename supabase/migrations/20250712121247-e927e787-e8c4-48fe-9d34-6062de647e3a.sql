-- Delete all test data in the correct order to respect foreign key constraints

-- 1. Delete live chat messages first (they reference live_chats)
DELETE FROM public.live_chat_messages;

-- 2. Delete live chats (they reference auftrag_assignments)
DELETE FROM public.live_chats;

-- 3. Delete employee activity logs (they reference evaluations and assignments)
DELETE FROM public.employee_activity_logs;

-- 4. Delete evaluations (they reference auftrag_assignments and evaluation_questions)
DELETE FROM public.evaluations;

-- 5. Delete user bonuses (they reference assignments)
DELETE FROM public.user_bonuses;

-- 6. Delete SMS requests (they reference phone_numbers)
DELETE FROM public.requests;

-- 7. Delete auftrag assignments (they reference auftraege)
DELETE FROM public.auftrag_assignments;

-- 8. Delete employment contracts (they reference appointments)
DELETE FROM public.employment_contracts;

-- 9. Delete contract request tokens (they reference appointments)
DELETE FROM public.contract_request_tokens;

-- 10. Delete appointment reminders (they reference appointments)
DELETE FROM public.appointment_reminders;

-- 11. Delete appointment status history (they reference appointments)
DELETE FROM public.appointment_status_history;

-- 12. Delete appointments (they reference appointment_recipients)
DELETE FROM public.appointments;

-- 13. Delete appointment recipients (no dependencies)
DELETE FROM public.appointment_recipients;

-- 14. Delete evaluation questions (they reference auftraege)
DELETE FROM public.evaluation_questions;

-- 15. Delete auftraege (no dependencies)
DELETE FROM public.auftraege;

-- 16. Delete phone numbers (no dependencies)
DELETE FROM public.phone_numbers;

-- 17. Delete support tickets (no dependencies)
DELETE FROM public.support_tickets;

-- 18. Delete blocked times (no dependencies)
DELETE FROM public.blocked_times;

-- 19. Delete user profiles (they reference auth.users, but we keep auth users)
DELETE FROM public.profiles WHERE id != auth.uid();

-- 20. Delete user roles except for the current admin user
DELETE FROM public.user_roles WHERE user_id != auth.uid();