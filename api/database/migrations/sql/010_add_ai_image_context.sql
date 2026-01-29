alter table users add column if not exists ai_default_image_context text;
alter table posts add column if not exists ai_image_context text;
