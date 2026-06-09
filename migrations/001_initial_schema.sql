-- ============================================================
-- 9JA FURNITURE HUB — Initial Database Schema
-- Run this first in your Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  role            text not null default 'buyer'
                    check (role in ('buyer','business','designer','admin')),
  state           text,
  business_name   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, role, state, business_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'business_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── KYC RECORDS ───────────────────────────────────────────
create table if not exists public.kyc_records (
  id                   uuid primary key default uuid_generate_v4(),
  profile_id           uuid unique not null references public.profiles(id) on delete cascade,
  -- Personal
  first_name           text,
  middle_name          text,
  last_name            text,
  date_of_birth        date,
  gender               text,
  nationality          text,
  state_of_origin      text,
  residential_address  text,
  phone                text,
  -- Delivery
  delivery_state       text,
  delivery_city        text,
  delivery_address     text,
  delivery_landmark    text,
  delivery_time        text,
  account_type         text,
  budget_range         text,
  -- Identity
  id_type              text,
  id_number            text,
  id_front_url         text,
  id_back_url          text,
  -- Style
  wood_finish          text,
  upholstery           text,
  project_timeline     text,
  total_budget         text,
  special_notes        text,
  discovery_source     text,
  marketing_consent    boolean default false,
  -- Status
  status               text not null default 'draft'
                         check (status in ('draft','under_review','verified','rejected')),
  submitted_at         timestamptz,
  reviewed_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── PRODUCTS ──────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  price        numeric(12,2) not null,
  category     text not null check (category in ('home','office','kitchen','outdoor','luxury')),
  subcategory  text,
  wood_type    text,
  state        text,   -- available state / warehouse
  in_stock     boolean default true,
  image_url    text,
  rating       numeric(3,2) default 0,
  review_count integer default 0,
  created_at   timestamptz not null default now()
);

-- ── ORDERS ────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  product_id      uuid references public.products(id),
  product_name    text not null,
  price           numeric(12,2) not null,
  category        text,
  delivery_state  text,
  order_ref       text unique,
  status          text not null default 'confirmed'
                    check (status in ('confirmed','in_production','quality_check','dispatched','delivered','cancelled')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── WISHLISTS ─────────────────────────────────────────────
create table if not exists public.wishlists (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  product_id   uuid references public.products(id),
  product_name text,
  price        numeric(12,2),
  created_at   timestamptz not null default now(),
  unique(user_id, product_id)
);

-- ── CONTACT MESSAGES ──────────────────────────────────────
create table if not exists public.contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  phone       text,
  subject     text,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ── REVIEWS ───────────────────────────────────────────────
create table if not exists public.reviews (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_profiles_updated_at  before update on public.profiles  for each row execute procedure public.set_updated_at();
create trigger set_kyc_updated_at       before update on public.kyc_records for each row execute procedure public.set_updated_at();
create trigger set_orders_updated_at    before update on public.orders     for each row execute procedure public.set_updated_at();
