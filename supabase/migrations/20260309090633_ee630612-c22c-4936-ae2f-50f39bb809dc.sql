
-- Replace overly permissive insert policy with a restrictive one
drop policy "System can insert history" on public.complaint_status_history;
create policy "Users can insert history for own complaints" on public.complaint_status_history
  for insert to authenticated with check (
    exists (select 1 from public.complaints where complaints.id = complaint_id and (complaints.user_id = auth.uid() or complaints.assigned_officer = auth.uid()))
    or public.has_role(auth.uid(), 'admin')
  );
