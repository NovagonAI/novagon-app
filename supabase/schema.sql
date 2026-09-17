-- ============================================================
-- Novagon — Supabase Schema
-- Jalankan seluruh file ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ogqaxlrmmrrokqvxanam/sql
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── workspaces ──────────────────────────────────────────────
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  deskripsi   text not null default '',
  qtpp        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at
  before update on workspaces
  for each row execute procedure update_updated_at();

-- ─── formulas ────────────────────────────────────────────────
-- Setiap edit formula = row baru. Tidak ada versioning berlapis.
-- Relasi: banyak formula per workspace.
create table if not exists formulas (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  nama          text not null,
  bahan         jsonb not null default '[]',
  -- bahan: [{nama: string, fungsi: string, persentase: number}]
  catatan       text,
  created_at    timestamptz not null default now()
);

create index if not exists formulas_workspace_id_idx on formulas(workspace_id);

-- ─── predictions ─────────────────────────────────────────────
create table if not exists predictions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  formula_id    uuid not null references formulas(id) on delete cascade,
  formula_nama  text not null,
  status        text not null default 'queue'
                check (status in ('queue', 'processing', 'done', 'failed')),
  raw_response  jsonb,         -- response mentah dari /v1/predict
  result        jsonb,         -- PredictionResult yang sudah diparsing untuk UI
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index if not exists predictions_workspace_id_idx on predictions(workspace_id);
create index if not exists predictions_formula_id_idx   on predictions(formula_id);

-- ─── safety_tests ────────────────────────────────────────────
create table if not exists safety_tests (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  prediction_id   uuid references predictions(id) on delete set null,
  formula_nama    text not null,
  status          text not null default 'draft'
                  check (status in ('draft', 'ongoing', 'selesai')),
  items           jsonb not null default '[]',
  -- items: [{nama, metode, hasil, kesimpulan: 'aman'|'perhatian'|'tidak_aman'}]
  kesimpulan_umum text,
  created_at      timestamptz not null default now()
);

create index if not exists safety_tests_workspace_id_idx on safety_tests(workspace_id);
