-- ============================================================
-- 9JA FURNITURE HUB — Row Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.kyc_records    enable row level security;
alter table public.orders         enable row level security;
alter table public.wishlists      enable row level security;
alter table public.contact_messages enable row level security;
alter table public.reviews        enable row level security;
alter table public.products       enable row level security;

-- ── PROFILES ──────────────────────────────────────────────
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- ── KYC RECORDS ───────────────────────────────────────────
create policy "Users can view own KYC"   on public.kyc_records for select using (auth.uid() = profile_id);
create policy "Users can insert own KYC" on public.kyc_records for insert with check (auth.uid() = profile_id);
create policy "Users can update own KYC" on public.kyc_records for update using (auth.uid() = profile_id);

-- ── ORDERS ────────────────────────────────────────────────
create policy "Users can view own orders"   on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users can update own orders" on public.orders for update using (auth.uid() = user_id);

-- ── WISHLISTS ─────────────────────────────────────────────
create policy "Users can manage own wishlist" on public.wishlists for all using (auth.uid() = user_id);

-- ── REVIEWS ───────────────────────────────────────────────
create policy "Users can view all reviews"   on public.reviews for select using (true);
create policy "Users can insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on public.reviews for update using (auth.uid() = user_id);

-- ── PRODUCTS (public read) ────────────────────────────────
create policy "Anyone can view products" on public.products for select using (true);

-- ── CONTACT MESSAGES (anyone can send) ───────────────────
create policy "Anyone can send contact messages" on public.contact_messages for insert with check (true);
