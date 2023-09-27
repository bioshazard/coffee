ALTER TABLE votes
ADD CONSTRAINT votes_per_card UNIQUE (card_id, owner_id);

-- Votes
alter table votes enable row level security;

create policy "votes: INSERT board_sub required"
on votes for insert with check (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id in (
      select owner_id from board_subs where board_subs.board_id = votes.board_id
    )
  )
);

create policy "votes: non-INSERT must match JWT"
on votes for all using (
  auth.jwt() ->> 'psuedonym' in (
    select psuedonym from psuedonyms where psuedonyms.id in (
      select owner_id from board_subs where board_subs.board_id = votes.board_id
    )
  )
);