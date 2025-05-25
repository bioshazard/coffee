ALTER TABLE cards
ADD COLUMN updated timestamp with time zone DEFAULT now() NOT NULL;

CREATE OR REPLACE FUNCTION update_cards_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER trg_update_cards_timestamp
BEFORE UPDATE ON cards
FOR EACH ROW EXECUTE FUNCTION update_cards_timestamp();
