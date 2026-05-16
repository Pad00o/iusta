
create table public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  token text not null unique,
  password_hash text,
  expires_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_shared_reports_token on public.shared_reports(token);

alter table public.shared_reports enable row level security;

create policy "Anyone can read shares by token"
  on public.shared_reports for select
  using (true);

create policy "Anyone can create shares"
  on public.shared_reports for insert
  with check (true);

create policy "Anyone can update view_count"
  on public.shared_reports for update
  using (true)
  with check (true);
