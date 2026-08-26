create table if not exists atlas_cloud (
  user_id text primary key,
  payload text not null,
  saved_at timestamptz not null default now()
);
