create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  linkedin_member_id text not null unique,
  name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists refresh_tokens (
  id uuid primary key,
  user_id uuid not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists refresh_tokens_user_id_idx on refresh_tokens(user_id);
