-- Populate telegram_chat_ids table with existing data
-- This will migrate from secrets to database table

-- Insert the main chat ID (from TELEGRAM_CHAT_ID secret)
INSERT INTO public.telegram_chat_ids (chat_id, name, description, is_active)
VALUES 
  ('7111152096', 'Main Admin Chat', 'Primary chat for general notifications', true)
ON CONFLICT (chat_id) DO NOTHING;

-- Add some test data for demonstration
INSERT INTO public.telegram_chat_ids (chat_id, name, description, is_active)
VALUES 
  ('123456789', 'Test Chat 1', 'Test chat for development purposes', false),
  ('987654321', 'Test Chat 2', 'Another test chat', false),
  ('555666777', 'Backup Admin Chat', 'Backup chat for critical notifications', true)
ON CONFLICT (chat_id) DO NOTHING;