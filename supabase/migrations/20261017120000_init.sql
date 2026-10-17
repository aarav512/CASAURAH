create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  full_name text not null default '' check (char_length(full_name) <= 80),
  organisation text not null default '' check (char_length(organisation) <= 120),
  email text not null default '',
  created_at timestamptz not null default now()
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('document', 'task')),
  title text not null check (char_length(title) between 3 and 160),
  detail text not null default '' check (char_length(detail) <= 2000),
  status text not null default 'requested' check (status in ('requested', 'submitted', 'under_review', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 140),
  mime text not null check (mime in (
    'application/pdf', 'image/jpeg', 'image/png', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  storage_path text not null unique check (storage_path !~ '\.\.' and storage_path like client_id::text || '/%'),
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  work_item_id uuid references public.work_items (id) on delete set null,
  actor_id uuid,
  body text not null check (char_length(body) between 1 and 1000),
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.status_events (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index work_items_client_status_idx on public.work_items (client_id, status);
create index documents_item_idx on public.documents (work_item_id);
create index activities_client_idx on public.activities (client_id, created_at desc);
create index status_events_item_idx on public.status_events (work_item_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.work_items enable row level security;
alter table public.documents enable row level security;
alter table public.activities enable row level security;
alter table public.status_events enable row level security;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (new.id, 'client', coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger work_items_touch
  before update on public.work_items
  for each row execute function private.touch_updated_at();

create or replace function private.log_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  label text;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    label := case new.status
      when 'requested' then 'Requested'
      when 'submitted' then 'Submitted'
      when 'under_review' then 'Under Review'
      when 'completed' then 'Completed'
      else new.status
    end;
    insert into public.status_events (work_item_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
    insert into public.activities (client_id, work_item_id, actor_id, body, internal)
    values (new.client_id, new.id, auth.uid(), 'Status set to ' || label || '.', false);
  end if;
  return new;
end;
$$;

create trigger work_items_status
  after update on public.work_items
  for each row execute function private.log_status();

create or replace function private.on_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.work_items set status = 'submitted' where id = new.work_item_id and status = 'requested';
  insert into public.activities (client_id, work_item_id, actor_id, body, internal)
  values (new.client_id, new.work_item_id, auth.uid(), 'A document record was added.', false);
  return new;
end;
$$;

create trigger documents_after
  after insert on public.documents
  for each row execute function private.on_document();

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
revoke all on function private.log_status() from public, anon, authenticated;
revoke all on function private.on_document() from public, anon, authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy items_select on public.work_items
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

create policy items_insert on public.work_items
  for insert to authenticated
  with check (
    (select private.is_admin())
    and exists (select 1 from public.profiles p where p.id = client_id and p.role = 'client')
  );

create policy items_update on public.work_items
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy docs_select on public.documents
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

create policy docs_insert on public.documents
  for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and storage_path like (select auth.uid())::text || '/%'
    and exists (
      select 1 from public.work_items w
      where w.id = work_item_id
        and w.client_id = (select auth.uid())
        and w.kind = 'document'
        and w.status in ('requested', 'submitted')
    )
  );

create policy notes_select on public.activities
  for select to authenticated
  using ((select private.is_admin()) or (client_id = (select auth.uid()) and internal = false));

create policy notes_insert on public.activities
  for insert to authenticated
  with check ((select private.is_admin()));

create policy events_select on public.status_events
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.work_items w
      where w.id = work_item_id and w.client_id = (select auth.uid())
    )
  );

revoke all on public.profiles, public.work_items, public.documents, public.activities, public.status_events from anon, authenticated;
grant select (id, role, full_name, organisation, email, created_at) on public.profiles to authenticated;
grant update (full_name, organisation) on public.profiles to authenticated;
grant select, insert, update on public.work_items to authenticated;
grant select, insert on public.documents to authenticated;
grant select, insert on public.activities to authenticated;
grant select on public.status_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy client_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('pdf', 'jpg', 'jpeg', 'png', 'csv', 'xlsx')
  );

create policy client_documents_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-documents'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );
