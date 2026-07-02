create or replace function complete_scan_job(
  p_id text,
  p_lease_token text,
  p_status text,
  p_finished_at timestamptz,
  p_result_summary jsonb,
  p_error_message text
)
returns setof scan_jobs
language sql
security invoker
set search_path = public
as $$
  update scan_jobs
  set
    status = p_status,
    finished_at = p_finished_at,
    result_summary = p_result_summary,
    error_message = p_error_message,
    updated_at = now()
  where id = p_id
    and status = 'running'
    and p_status in ('succeeded', 'partial_success', 'failed')
    and result_summary->>'leaseToken' = p_lease_token
  returning *;
$$;

revoke all on function complete_scan_job(text, text, text, timestamptz, jsonb, text)
  from public, anon, authenticated;
grant execute on function complete_scan_job(text, text, text, timestamptz, jsonb, text)
  to service_role;
