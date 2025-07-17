-- Remove the telegram_chat_ids table as it's no longer needed
-- Chat IDs are now managed via Supabase secrets

DROP TABLE IF EXISTS public.telegram_chat_ids;