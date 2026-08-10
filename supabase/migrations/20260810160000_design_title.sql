-- Designs get a name of their own.
--
-- Until now `designLabel()` fell back to the raw prompt, so a card, a page
-- title and a receipt all read "a moth with cathedral windows for wings, wings
-- spread wide". That is the art direction, not a name — it is long, it repeats
-- the prompt block directly underneath it, and it makes every <title> a
-- paragraph.
--
-- Written by the same model call that writes the prompt (lib/generation/kimi.ts)
-- so the two always describe the same design. Nullable: every design generated
-- before this has no title and keeps falling back to the prompt.
alter table public.designs add column if not exists title text;

comment on column public.designs.title is
  'Short human name, 5-7 words. Written by the composer alongside the prompt. Null on pre-composer designs, which fall back to the prompt.';

-- Backfill: the first seven words of the prompt.
--
-- Not as good as a written title and not trying to be — it is the same clamp
-- the no-model fallback applies (lib/generation/compose.ts titleFromIdea), so
-- every existing design gets a headline instead of a paragraph today rather
-- than after somebody regenerates it. Anything already titled is left alone.
update public.designs
set title = array_to_string(
  (string_to_array(regexp_replace(trim(prompt), '\s+', ' ', 'g'), ' '))[1:7],
  ' '
)
where title is null
  and prompt is not null
  and trim(prompt) <> '';

-- Seven words into a sentence usually lands mid-clause, so a clipped title
-- ends in a stray comma. Same trailing-punctuation strip cleanTitle() does.
update public.designs
set title = regexp_replace(title, '[[:punct:]]+$', '')
where title ~ '[[:punct:]]$';
