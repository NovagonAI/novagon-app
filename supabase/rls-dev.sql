-- ============================================================
-- RLS Policies untuk mode development (tanpa auth)
-- Jalankan di Supabase SQL Editor setelah schema.sql
--
-- CATATAN: Policy ini mengizinkan semua operasi dari anon key.
-- Saat auth ditambahkan nanti, replace dengan policy berbasis user_id.
-- ============================================================

-- Enable RLS (sudah enabled by default di Supabase, pastikan aktif)
alter table workspaces  enable row level security;
alter table formulas    enable row level security;
alter table predictions enable row level security;
alter table safety_tests enable row level security;

-- ── workspaces ──────────────────────────────────────────────
create policy "anon_all_workspaces" on workspaces
  for all to anon using (true) with check (true);

-- ── formulas ────────────────────────────────────────────────
create policy "anon_all_formulas" on formulas
  for all to anon using (true) with check (true);

-- ── predictions ─────────────────────────────────────────────
create policy "anon_all_predictions" on predictions
  for all to anon using (true) with check (true);

-- ── safety_tests ────────────────────────────────────────────
create policy "anon_all_safety_tests" on safety_tests
  for all to anon using (true) with check (true);
