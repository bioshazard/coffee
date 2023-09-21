-- -- Scheme: Wide open, but board UUIDs aren't discoverable
-- -- - users can self-manage profiles, automatic at visit
-- -- - boardsubs are self-managable linked to profiles
-- -- - boards are only visible if subbed. auto-sub on board visit
-- -- - board list from home after for convenience
-- -- - cards and votes visible based on board sub link

-- CREATE OR REPLACE FUNCTION get_guest_id() RETURNS json
--  LANGUAGE sql STABLE 
-- AS $$
--  RETURN SELECT (current_setting('request.headers')::json); 
-- $$;


-- create or replace function get_jwt()
-- returns text as $$
-- begin
--   return auth.jwt();
-- end;
-- $$ language plpgsql security definer;

create table
  boards (
    id uuid primary key default uuid_generate_v4 (),
    title text not null,
    timer timestamp with time zone default now(),
    kind text
    -- owner?
  );

create table
  cards (
    id uuid primary key default uuid_generate_v4 (),
    boardid uuid references boards(id),
    created timestamp with time zone default now(),
    content text not null,
    col int
    -- boardId bigint,
    -- foreign key (boardId) references boards (id)
  );

create table
  votes (
    id uuid primary key default uuid_generate_v4 (),
    boardid uuid references boards(id), -- allows avoiding left join and just doing realtime on each
    cardid uuid references cards(id),
    count int,
    owner text
    -- cardId bigint,
    -- foreign key (cardId) references cards (id)
  );

-- RLS

-- Profiles
create table
  profiles (
    id uuid primary key default uuid_generate_v4 (),
    name text,
    email text,
    psuedonym text unique
  );

alter table profiles enable row level security;

create policy "Self Manage Profile"
on profiles 
using (
  persistanon auth.jwt() ->> 'psuedonym'
);

-- Board subscriptions
create table
  board_subs (
    id uuid primary key default uuid_generate_v4 (),
    boardid uuid references boards(id),
    profileid uuid references profiles(id)
  );

alter table board_subs enable row level security;

create policy "Self Manage Board Subs"
  on board_subs
  using (
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles where profileid = id
    )
  );

-- Board perms:
-- - Leave board insert open
-- - Require select, update, delete locked to subs

alter table boards enable row level security;

create policy "Public board insert with valid profile"
  on boards for insert
  with check ( 
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles
    )
  );

-- TODO: restrict delete to board owner
create policy "Self manage boards after insert if subbed"
  on boards for all
  using (
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles where profiles.id in (
        select profileid from board_subs where board_subs.boardid = boards.id
      )
    )
  );

-- Cards RLS

alter table cards enable row level security;

create policy "Card insert with board sub"
  on cards for insert
  with check ( 
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles where profiles.id in (
        select profileid from board_subs where board_subs.boardid = cards.boardid
      )
    )
  );

-- TODO: restrict delete to board owner
create policy "Card s/u/d with board sub"
  on cards for all
  using (
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles where profiles.id in (
        select profileid from board_subs where board_subs.boardid = cards.boardid
      )
    )
  );

-- Votes RLS

alter table votes enable row level security;

create policy "Vote insert with board sub"
  on votes for insert
  with check ( 
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles where profiles.id in (
        select profileid from board_subs where board_subs.boardid = votes.boardid
      )
    )
  );

-- TODO: restrict delete to board owner
create policy "Vote s/u/d with board sub"
  on votes for all
  using (
    current_setting('request.headers')::json ->> 'persistanon' in (
      select persistanon from profiles where profiles.id in (
        select profileid from board_subs where board_subs.boardid = votes.boardid
      )
    )
  );

-- Add realtime replication
alter publication supabase_realtime
add table boards, cards, votes, board_subs;

-- TODO: Add some indexes to speed it up??



