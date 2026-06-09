-- ============================================================
-- 9JA FURNITURE HUB — Storage Buckets
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- Create KYC documents bucket (private)
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- Create product images bucket (public)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ── KYC Documents: users manage their own files ────────────
create policy "Users can upload own KYC docs"
  on storage.objects for insert
  with check (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own KYC docs"
  on storage.objects for select
  using (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own KYC docs"
  on storage.objects for update
  using (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Product Images: anyone can view ───────────────────────
create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
