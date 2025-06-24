
-- Remove the old constraint that doesn't include 'infos_angefragt'
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_appointment_status;

-- Verify the new constraint exists and includes all valid statuses
-- The constraint 'appointments_status_check' should already exist from the previous migration
-- but let's ensure it's properly set up
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'interessiert', 'abgelehnt', 'mailbox', 'infos_angefragt'));
