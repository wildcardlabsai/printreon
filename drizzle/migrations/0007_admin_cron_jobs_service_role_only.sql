CREATE OR REPLACE FUNCTION public.admin_cron_jobs()
RETURNS TABLE(jobname text, schedule text, active boolean, last_status text, last_run timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT j.jobname::text,
         j.schedule::text,
         j.active,
         d.status::text,
         d.start_time
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT status, start_time
    FROM cron.job_run_details r
    WHERE r.jobid = j.jobid
    ORDER BY r.start_time DESC
    LIMIT 1
  ) d ON true;
$$;

REVOKE ALL ON FUNCTION public.admin_cron_jobs() FROM public;
REVOKE ALL ON FUNCTION public.admin_cron_jobs() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cron_jobs() TO service_role;