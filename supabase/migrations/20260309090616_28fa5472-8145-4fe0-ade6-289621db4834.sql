
-- Status history table for timeline tracking
create table public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references public.complaints(id) on delete cascade not null,
  status text not null,
  changed_by uuid references auth.users(id),
  remarks text,
  created_at timestamptz default now()
);

alter table public.complaint_status_history enable row level security;

-- RLS: complaint owner can view, officers/admins can view
create policy "Complaint owner can view history" on public.complaint_status_history
  for select using (
    exists (select 1 from public.complaints where complaints.id = complaint_id and complaints.user_id = auth.uid())
  );
create policy "Officers can view assigned complaint history" on public.complaint_status_history
  for select using (
    exists (select 1 from public.complaints where complaints.id = complaint_id and complaints.assigned_officer = auth.uid())
  );
create policy "Admins can view all history" on public.complaint_status_history
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "System can insert history" on public.complaint_status_history
  for insert to authenticated with check (true);

-- Trigger: auto-log status changes on complaints
create or replace function public.log_complaint_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- On insert, log the initial status
  if TG_OP = 'INSERT' then
    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks)
    values (NEW.id, NEW.status::text, NEW.user_id, null);
    return NEW;
  end if;
  -- On update, log if status changed
  if TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status then
    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks)
    values (NEW.id, NEW.status::text, auth.uid(), NEW.remarks);
  end if;
  return NEW;
end;
$$;

create trigger on_complaint_status_change
  after insert or update on public.complaints
  for each row execute function public.log_complaint_status_change();
