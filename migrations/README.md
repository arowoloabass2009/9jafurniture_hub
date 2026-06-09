# 9ja Furniture Hub — Database Setup

## Supabase Project (Connected ✅)

- **Project URL:** https://xzgrcahunjnhpqicvpwp.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/xzgrcahunjnhpqicvpwp
- **SQL Editor:** https://supabase.com/dashboard/project/xzgrcahunjnhpqicvpwp/sql

## Database Setup Steps

Run the SQL files **in order** in the Supabase SQL Editor:

```
001_initial_schema.sql  → Tables, triggers, functions
002_rls_policies.sql    → Row Level Security policies
003_storage.sql         → Storage buckets for KYC docs & product images
```

## Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (linked to Supabase Auth) |
| `kyc_records` | Identity & delivery verification data |
| `products` | Furniture product catalogue |
| `orders` | Customer purchase orders |
| `wishlists` | Saved/favourited products |
| `reviews` | Product ratings and reviews |
| `contact_messages` | Enquiry form submissions |

## Running the App

```bash
npm install
npm run dev        # Start browser-sync dev server
npm run build      # Compile TypeScript → js/app.js
npm run watch      # Watch TypeScript changes
```
