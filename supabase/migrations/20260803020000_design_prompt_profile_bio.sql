-- Design dialog needs two fields that don't exist yet: the prompt used to
-- generate the design, and a short creator bio.
alter table public.designs add column prompt text;
alter table public.profiles add column bio text;
