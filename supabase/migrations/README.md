Migrations for the Iron ankr project

This folder contains SQL migrations for a Postgres database (compatible with Supabase).

How to apply (Supabase CLI)
- Ensure the Supabase CLI is installed and configured for your project.
- Place this repository at the root of your Supabase project or point the CLI at the directory.
- Run: supabase db reset (dangerous) or supabase db push (non-destructive) depending on workflow.

How to apply (psql)
- Set the DATABASE_URL env var to your Postgres connection string.
- Run: psql "$DATABASE_URL" -f migrations/0001_initial.sql

Notes
- The migration creates enum types, trigger helpers for updated_at, and tables matching src/db/schema.ts.
- If you have existing data, review constraints and indexes, and adjust defaults as necessary.

