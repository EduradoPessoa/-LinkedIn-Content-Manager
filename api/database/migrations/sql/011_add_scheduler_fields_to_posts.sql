alter table posts add column if not exists publish_attempts integer not null default 0;
alter table posts add column if not exists publish_last_error text;
alter table posts add column if not exists publish_locked_at timestamptz;

create index if not exists posts_scheduled_at_idx on posts(scheduled_at);
