
-- Create enums
create type public.app_role as enum ('citizen', 'officer', 'admin');
create type public.complaint_status as enum ('submitted', 'under_review', 'assigned', 'in_progress', 'resolved');
create type public.complaint_category as enum ('road_infrastructure', 'water_supply', 'electricity', 'waste_management', 'public_safety', 'other');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text default '',
  created_at timestamptz default now()
);

-- User roles table (separate from profiles per security best practice)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'citizen',
  unique (user_id, role)
);

-- Departments table
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Complaints table
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  category complaint_category not null default 'other',
  latitude double precision,
  longitude double precision,
  image_url text,
  status complaint_status not null default 'submitted',
  assigned_officer uuid references auth.users(id),
  department_id uuid references public.departments(id),
  remarks text,
  created_at timestamptz default now()
);

-- Feedback table
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references public.complaints(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comments text,
  created_at timestamptz default now(),
  unique(complaint_id, user_id)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.complaints enable row level security;
alter table public.feedback enable row level security;

-- Security definer function for role checking (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Helper function to get user role
create or replace function public.get_user_role(_user_id uuid)
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles
  where user_id = _user_id
  limit 1
$$;

-- Profiles RLS policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Officers can view profiles" on public.profiles for select using (public.has_role(auth.uid(), 'officer'));

-- User roles RLS policies
create policy "Users can view own role" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert roles" on public.user_roles for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update roles" on public.user_roles for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete roles" on public.user_roles for delete using (public.has_role(auth.uid(), 'admin'));

-- Departments RLS policies
create policy "Anyone authenticated can view departments" on public.departments for select to authenticated using (true);
create policy "Admins can insert departments" on public.departments for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update departments" on public.departments for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete departments" on public.departments for delete using (public.has_role(auth.uid(), 'admin'));

-- Complaints RLS policies
create policy "Citizens can view own complaints" on public.complaints for select using (auth.uid() = user_id);
create policy "Citizens can insert complaints" on public.complaints for insert with check (auth.uid() = user_id);
create policy "Officers can view assigned complaints" on public.complaints for select using (auth.uid() = assigned_officer);
create policy "Officers can update assigned complaints" on public.complaints for update using (auth.uid() = assigned_officer);
create policy "Admins can view all complaints" on public.complaints for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update all complaints" on public.complaints for update using (public.has_role(auth.uid(), 'admin'));

-- Feedback RLS policies
create policy "Users can view own feedback" on public.feedback for select using (auth.uid() = user_id);
create policy "Users can insert own feedback" on public.feedback for insert with check (auth.uid() = user_id);
create policy "Admins can view all feedback" on public.feedback for select using (public.has_role(auth.uid(), 'admin'));
create policy "Officers can view feedback on assigned complaints" on public.feedback for select using (
  exists (select 1 from public.complaints where complaints.id = complaint_id and complaints.assigned_officer = auth.uid())
);

-- Trigger to auto-create profile and role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::app_role, 'citizen'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Insert default departments
insert into public.departments (name) values
  ('Road Department'),
  ('Water Department'),
  ('Electricity Department'),
  ('Waste Management Department'),
  ('Public Safety Department');

-- Storage bucket for complaint images
insert into storage.buckets (id, name, public) values ('complaint-images', 'complaint-images', true);

-- Storage RLS policies
create policy "Anyone can view complaint images" on storage.objects for select using (bucket_id = 'complaint-images');
create policy "Authenticated users can upload complaint images" on storage.objects for insert to authenticated with check (bucket_id = 'complaint-images');
