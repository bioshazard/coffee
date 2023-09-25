-- -- JWT testing
-- create or replace function get_jwt()
-- returns text as $$
-- begin
--   return auth.jwt();
-- end;
-- $$ language plpgsql security definer;

-- # Tables Definitions

create table psuedonyms (
  id uuid primary key default uuid_generate_v4 (),
  psuedonym text unique
);

create table boards (
  id uuid primary key default uuid_generate_v4 (),
  owner_id uuid references psuedonyms(id),
  title text not null,
  timer timestamp with time zone default now(),
  kind text
);

create table board_subs (
  id uuid primary key default uuid_generate_v4 (),
  owner_id uuid references psuedonyms(id),
  board_id uuid references boards(id)
);

create table cards (
  id uuid primary key default uuid_generate_v4 (),
  board_id uuid references boards(id),
  created timestamp with time zone default now(),
  content text not null,
  col int
);

create table votes (
  id uuid primary key default uuid_generate_v4 (),
  owner_id uuid references psuedonyms(id),
  board_id uuid references boards(id), -- Don't left join through cards, easier for realtime and auth
  card_id uuid references cards(id),
  count int
);

-- # RLS

-- Psuedonym registry: Used to obfuscate as id and for RLS against JWT later
alter table psuedonyms enable row level security;

create policy "Psuedonym: INSERT must match JWT"
on psuedonyms for insert with check (
  psuedonym = auth.jwt() ->> 'psuedonym'
);

create policy "Psuedonym: non-INSERT must match JWT"
on psuedonyms for all using (
  psuedonym = auth.jwt() ->> 'psuedonym'
);

-- Board Subscriptions: Self-service board access
-- Boards table CRUD requires assignment here, requires knowledge of board UUID
alter table board_subs enable row level security;

create policy "Board Subs: INSERT must match JWT"
on board_subs for insert with check (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id = board_subs.owner_id
  )
);

create policy "Board Subs: non-INSERT must match JWT"
on board_subs for all using (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id = board_subs.owner_id
  )
);

-- Boards: Lock access to subbed boards. Security through obscurity.
alter table boards enable row level security;

create policy "Boards: INSERT owner must match JWT"
on boards for insert with check (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id = boards.owner_id
  )
);

-- TODO: owner delete only
create policy "Boards: non-INSERT must match JWT"
on boards for all using (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id in (
      select owner_id from board_subs where board_subs.board_id = boards.id
    )
  )
);

-- Cards
alter table cards enable row level security;

create policy "cards: INSERT board_sub required"
on cards for insert with check (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id in (
      select owner_id from board_subs where board_subs.board_id = cards.board_id
    )
  )
);

create policy "cards: non-INSERT must match JWT"
on cards for all using (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id in (
      select owner_id from board_subs where board_subs.board_id = cards.board_id
    )
  )
);

-- Add realtime replication
alter publication supabase_realtime
add table boards, cards, votes;

-- TODO: Do I need `with check` on UPDATEs?
-- Otherwise one could do arbitrary updates?
