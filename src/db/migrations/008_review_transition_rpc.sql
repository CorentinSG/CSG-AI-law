-- Migration 008: atomic review transition RPC
--
-- Problem (D2 from codebase review):
-- transitionReviewStatus() in supabase-repository.ts makes two separate DB
-- calls — one UPDATE on ai_regulatory_updates, one INSERT into review_events.
-- If the second call fails, the status change is committed but the audit trail
-- is lost.
--
-- Fix: wrap both writes in a Postgres function so they execute in a single
-- transaction. The repository calls rpc('transition_review_status', ...) instead
-- of two round trips.
--
-- Safety:
-- - The function validates the status transition before applying any write.
-- - Discovery-only source blocking is enforced in the application layer before
--   this RPC is called (the RPC itself does not need to know about source types).
-- - Publication eligibility checks also remain in the application layer.
-- - This function only runs as the service_role; public/anon cannot call it.

CREATE OR REPLACE FUNCTION public.transition_review_status(
  p_update_id      TEXT,
  p_next_status    TEXT,
  p_reviewer       TEXT,
  p_previous_status TEXT,
  p_event_id       TEXT,
  p_published_at   TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF ai_regulatory_updates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_row ai_regulatory_updates;
BEGIN
  -- Validate allowed transitions (mirrors assertValidStatusTransition in TypeScript).
  IF NOT (
    (p_previous_status = 'needs_review' AND p_next_status IN ('approved', 'rejected', 'archived')) OR
    (p_previous_status = 'approved'     AND p_next_status IN ('published', 'archived')) OR
    (p_previous_status = 'published'    AND p_next_status = 'archived') OR
    (p_previous_status = 'rejected'     AND p_next_status = 'archived')
  ) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', p_previous_status, p_next_status;
  END IF;

  -- Update the regulatory update status.
  UPDATE ai_regulatory_updates
  SET
    status      = p_next_status,
    reviewed_by = p_reviewer,
    reviewed_at = v_now,
    published_at = COALESCE(p_published_at, published_at),
    updated_at  = v_now
  WHERE id = p_update_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Regulatory update % not found', p_update_id;
  END IF;

  -- Append the audit event in the same transaction.
  INSERT INTO review_events (
    id,
    regulatory_update_id,
    source_id,
    raw_item_id,
    event_type,
    actor,
    previous_status,
    next_status,
    notes,
    metadata,
    created_at
  ) VALUES (
    p_event_id,
    v_row.id,
    v_row.source_id,
    v_row.raw_item_id,
    'status_transition',
    p_reviewer,
    p_previous_status,
    p_next_status,
    'Status changed from ' || p_previous_status || ' to ' || p_next_status || '.',
    jsonb_build_object('publicationEligible', p_next_status = 'published'),
    v_now
  );

  RETURN NEXT v_row;
END;
$$;

-- Grant execution only to service_role (used by the backend).
-- Public/anon roles cannot call this function.
REVOKE EXECUTE ON FUNCTION public.transition_review_status FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.transition_review_status TO service_role;

COMMENT ON FUNCTION public.transition_review_status IS
  'Atomically updates ai_regulatory_updates status and inserts a review_event audit entry. '
  'Validates the transition before any write. Called by the Supabase repository layer.';
