-- The design dialog's creator box needs to resolve "who prompted this
-- design" for any visitor, not just the job's owner — the existing
-- owner-only policy (generation_jobs_owner_all) blocks that read entirely
-- for everyone else. Adds a second, narrower permissive policy: a
-- generation_jobs row becomes publicly readable once it produced a design
-- that's actually public (approved). Postgres ORs multiple permissive
-- policies together, so the owner's own full access is unaffected — this
-- only adds visibility, never removes it.
create policy "generation_jobs_select_public_result" on public.generation_jobs
  for select using (
    result_design_id is not null
    and exists (
      select 1 from public.designs d
      where d.id = generation_jobs.result_design_id
        and d.moderation_status = 'approved'
    )
  );
