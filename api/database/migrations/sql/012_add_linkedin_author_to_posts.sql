alter table posts add column if not exists linkedin_author_type text not null default 'person';
alter table posts add column if not exists linkedin_author_urn text;

create index if not exists posts_linkedin_author_type_idx on posts(linkedin_author_type);
