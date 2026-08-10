-- Background removal moves out of generation and becomes the maker's button.
--
-- Generation used to cut the flat field off every design automatically. On a
-- poster-style plate that was destructive and silent: ai-background-remover
-- isolates a *subject*, so it kept the character and deleted the title and the
-- line. Nobody could undo it, because the uncut file was never stored.
--
-- Now the cut writes a new object and records where the original lives, so
-- "remove background" has an undo and a bad cut costs a click.
alter table public.designs add column if not exists original_image_url text;

comment on column public.designs.original_image_url is
  'The uncut artwork, set the first time a maker removes the background. Null means image_url is still the original.';
