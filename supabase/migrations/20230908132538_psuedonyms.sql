create table
  psuedonyms (
    id uuid primary key default uuid_generate_v4 (),
    psuedonym text unique
  );

alter table psuedonyms enable row level security;

create policy "Self-insert Psuedonym"
on psuedonyms for insert
with check (
  psuedonym = auth.jwt() ->> 'psuedonym'
);

-- create policy "Self Manage Profile"
-- on psuedonyms 
-- using (
--   psuedonym = auth.jwt() ->> 'psuedonym'
-- )

create or replace function get_jwt()
returns text as $$
begin
  return auth.jwt();
end;
$$ language plpgsql security definer;