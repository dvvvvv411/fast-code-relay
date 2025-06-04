
-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run appointment reminders every 5 minutes
SELECT cron.schedule(
  'appointment-reminders',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://uylujlvfyhftgaztwowf.supabase.co/functions/v1/send-appointment-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bHVqbHZmeWhmdGdhenR3b3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDQ5MzMsImV4cCI6MjA2MzUyMDkzM30.H9_Q9zCakrirMy3eI_Km3wao8pxo9be9nNJSHg6gClc"}'::jsonb,
        body:='{"triggered_by": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Add a function to check cron job status
CREATE OR REPLACE FUNCTION get_cron_jobs()
RETURNS TABLE(
    jobid bigint,
    schedule text,
    command text,
    nodename text,
    nodeport integer,
    database text,
    username text,
    active boolean,
    jobname text
) 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT * FROM cron.job;
$$;
