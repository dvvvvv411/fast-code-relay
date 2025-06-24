
-- Add the new status 'infos_angefragt' to the appointments table status constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'interessiert', 'abgelehnt', 'mailbox', 'infos_angefragt'));
