create table if not exists linkedin_accounts (
  id uuid primary key,
  user_id uuid not null,
  provider text not null,
  provider_account_id text not null,
  access_token_encrypted text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create index if not exists linkedin_accounts_user_id_idx on linkedin_accounts(user_id);
