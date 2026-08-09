-- The design dialog's creator box needs to resolve "who prompted this
-- design" for any visitor, not just the job's owner — the existing
-- owner-only policy (generation_jobs_owner_all) blocks that read entirely
-- for everyone else. Adds a second, narrower permissive policy: a
-- generation_jobs row becomes publicly readable once it produced a design
-- that's actually public. Postgres ORs multiple permissive policies
-- together, so the owner's own full access is unaffected — this only adds
-- visibility, never removes it.
--
-- Two conditions, both load-bearing:
--
--   * `listed_at is not null` — approval alone is not publication. Designs are
--     auto-approved at generation and stay private until the maker lists them
--     (see designs_select_listed, which gates the design itself the same way).
--     Without this, `text_content` and `quote_content` — the words printed on
--     an unlisted design — would be readable by anyone with the anon key, past
--     the gate that hides the design itself.
--
--   * joined on `generation_job_id`, not `result_design_id` — a job produces
--     four images but records only the first as its result. Keying on the
--     result would hide the job (and so the creator box) for the other three
--     whenever the first one wasn't the listed one.
create policy "generation_jobs_select_public_result" on public.generation_jobs
  for select using (
    exists (
      select 1 from public.designs d
      where d.generation_job_id = generation_jobs.id
        and d.moderation_status = 'approved'
        and d.listed_at is not null
    )
  );
