
-- Delete all test data in the correct order to respect foreign key constraints

-- 1. Delete live chat messages first (they reference live_chats)
DELETE FROM public.live_chat_messages;

-- 2. Delete live chats (they reference auftrag_assignments)
DELETE FROM public.live_chats;

-- 3. Delete SMS requests (they reference phone_numbers)
DELETE FROM public.requests;

-- 4. Delete phone numbers (no dependencies)
DELETE FROM public.phone_numbers;

-- 5. Delete support tickets (no dependencies)
DELETE FROM public.support_tickets;
