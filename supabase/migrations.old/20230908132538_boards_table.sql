-- Profiles
create table
  profiles (
    id uuid primary key default uuid_generate_v4 (),
    name text,
    email text,
    persistanon text unique
  );

alter table profiles enable row level security;

create policy "Self Manage Profile"
on profiles 
using ( persistanon = current_setting('request.headers')::json ->> 'persistanon' );