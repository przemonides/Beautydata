-- =============================================
-- Treatly CRM — Supabase Database Schema
-- =============================================

-- 1. Salons
create table if not exists salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text not null,
  created_at timestamptz default now()
);

alter table salons enable row level security;

create policy "Users can view their own salon"
  on salons for select
  using (owner_email = auth.jwt() ->> 'email');

create policy "Users can insert their own salon"
  on salons for insert
  with check (owner_email = auth.jwt() ->> 'email');

create policy "Users can update their own salon"
  on salons for update
  using (owner_email = auth.jwt() ->> 'email');

-- 2. Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  birthdate date,
  notes text,
  created_at timestamptz default now()
);

alter table clients enable row level security;

create policy "Salon can view own clients"
  on clients for select
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can insert own clients"
  on clients for insert
  with check (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can update own clients"
  on clients for update
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can delete own clients"
  on clients for delete
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

-- 3. Services
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  category text,
  duration_minutes integer,
  price decimal
);

alter table services enable row level security;

create policy "Salon can view own services"
  on services for select
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can insert own services"
  on services for insert
  with check (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can update own services"
  on services for update
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can delete own services"
  on services for delete
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

-- 4. Visits
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  visit_date date not null,
  price_paid decimal,
  notes text,
  created_at timestamptz default now()
);

alter table visits enable row level security;

create policy "Salon can view own visits"
  on visits for select
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can insert own visits"
  on visits for insert
  with check (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can update own visits"
  on visits for update
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can delete own visits"
  on visits for delete
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

-- 5. Recommendations
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  recommendation_text text,
  generated_at timestamptz default now(),
  is_read boolean default false
);

alter table recommendations enable row level security;

create policy "Salon can view own recommendations"
  on recommendations for select
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can insert own recommendations"
  on recommendations for insert
  with check (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));

create policy "Salon can update own recommendations"
  on recommendations for update
  using (salon_id in (select id from salons where owner_email = auth.jwt() ->> 'email'));
