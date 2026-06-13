create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  category text not null check (category in ('keyboard', 'keycap', 'stabilizer', 'other')),
  price integer not null check (price >= 0),
  condition_score integer not null check (condition_score in (95, 85, 70, 50)),
  condition_label text not null,
  description text not null check (char_length(description) between 5 and 2000),
  discord_id text,
  checkout_url text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'sold', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_created_at_idx
  on public.listings (status, created_at desc);

create index if not exists listings_category_idx
  on public.listings (category);

grant usage on schema public to anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;

create trigger listings_set_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

alter table public.listings enable row level security;

drop policy if exists "Anyone can read active listings" on public.listings;
create policy "Anyone can read active listings"
on public.listings
for select
using (status = 'active');

drop policy if exists "Users can insert their own listings" on public.listings;
create policy "Users can insert their own listings"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own listings" on public.listings;
create policy "Users can update their own listings"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own listings" on public.listings;
create policy "Users can delete their own listings"
on public.listings
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can read listing photos" on storage.objects;
create policy "Anyone can read listing photos"
on storage.objects
for select
using (bucket_id = 'listing-photos');

drop policy if exists "Users can upload listing photos" on storage.objects;
create policy "Users can upload listing photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their listing photos" on storage.objects;
create policy "Users can update their listing photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their listing photos" on storage.objects;
create policy "Users can delete their listing photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
