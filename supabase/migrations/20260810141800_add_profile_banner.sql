-- Add banner_url to public.profiles table for creator storefront banners
alter table public.profiles add column if not exists banner_url text;
