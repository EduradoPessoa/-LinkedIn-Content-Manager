alter table users add column if not exists ai_default_post_context text;
alter table users add column if not exists updated_at timestamptz not null default now();
