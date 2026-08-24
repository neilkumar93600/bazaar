-- A creator describes their storefront in a sentence; a model turns it into
-- these tokens; `app/(public)/creator/[handle]` renders them as CSS custom
-- properties.
--
-- jsonb, not eight columns: the shape is owned by lib/storefront/theme.ts and
-- will grow (layout, banner artwork) without a migration each time. Nothing
-- queries inside it — it is read whole, for one profile, on that profile's own
-- page — so there is no index to earn here.
--
-- NULL means house style. parseTheme() falls back field by field, so a row
-- written by an older or newer version of the schema still renders.
--
-- Unlike public.designs (see 20260824120000_hide_prompt_column.sql), this table
-- still has its table-level select grant, so the new column is readable by
-- anon and authenticated without a column grant. That is intended: a
-- storefront's own theme is as public as the storefront.

alter table public.profiles
  add column if not exists storefront_theme jsonb;

comment on column public.profiles.storefront_theme is
  'Storefront look, written by the AI theming prompt in dashboard settings. '
  'Validated shape lives in lib/storefront/theme.ts (parseTheme) — never render '
  'these values without it. NULL = house style.';
