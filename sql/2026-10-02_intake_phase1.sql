-- Phase 1 of the client intake / update-request feature.
-- Run this once in the Supabase SQL editor. This repo has no migration
-- tooling, so this file is kept only as a record of what was run and when.

create table if not exists student_profiles (
  student_id uuid primary key references students(id) on delete cascade,

  dob date,
  nickname text,
  guardian_name text,
  guardian_relationship text,
  guardian_phone text,

  other_guardian text,
  siblings text,
  family_dynamics text,

  interests text,
  strengths text,

  communication_today text,
  diagnosis text,
  prior_aac_history text,
  s2c_duration text,
  wordup_duration text,
  other_practitioner text,
  crps_supporting text,

  school_setting jsonb,
  motor_profile jsonb,
  sensory_profile jsonb,
  regulation_profile jsonb,

  allergies text,
  food_aversions text,
  emergency_contact jsonb,

  fields_needing_review text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists intake_requests (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  practitioner_id text not null,
  student_id uuid references students(id) on delete set null,

  channel text not null check (channel in ('email', 'text')),
  recipient_email text,
  recipient_phone text,
  quoted_fee numeric,

  status text not null default 'sent' check (status in ('sent', 'submitted', 'approved', 'dismissed')),
  submitted_data jsonb,
  fields_needing_review text[],

  sent_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  reviewed_by text,
  created_student_id uuid references students(id)
);

create index if not exists intake_requests_practitioner_status_idx
  on intake_requests (practitioner_id, status);

create index if not exists intake_requests_student_idx
  on intake_requests (student_id);
