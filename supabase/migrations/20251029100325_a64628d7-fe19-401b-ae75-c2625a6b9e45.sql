-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  topic TEXT,
  item TEXT,
  imposters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create game_data table for topics and items
CREATE TABLE public.game_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  items TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games (public readable, host can update)
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create games"
  ON public.games FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Host can update their game"
  ON public.games FOR UPDATE
  USING (true);

CREATE POLICY "Host can delete their game"
  ON public.games FOR DELETE
  USING (true);

-- RLS Policies for players
CREATE POLICY "Players are viewable by everyone"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON public.players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON public.players FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete players"
  ON public.players FOR DELETE
  USING (true);

-- RLS Policies for game_data (read-only for everyone)
CREATE POLICY "Game data is viewable by everyone"
  ON public.game_data FOR SELECT
  USING (true);

-- Enable realtime for games and players
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for games table
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 40 topics with 2 items each (80 items total)
INSERT INTO public.game_data (topic, items) VALUES
  ('Drinken', ARRAY['Prik', 'Bier']),
  ('Eten', ARRAY['Pizza', 'Sushi']),
  ('Sport', ARRAY['Voetbal', 'Tennis']),
  ('Vervoer', ARRAY['Fiets', 'Auto']),
  ('Dieren', ARRAY['Hond', 'Kat']),
  ('Muziek', ARRAY['Piano', 'Gitaar']),
  ('Kleuren', ARRAY['Rood', 'Blauw']),
  ('Vakantie', ARRAY['Strand', 'Bergen']),
  ('Film', ARRAY['Horror', 'Komedie']),
  ('Seizoen', ARRAY['Zomer', 'Winter']),
  ('Fruit', ARRAY['Appel', 'Banaan']),
  ('School', ARRAY['Wiskunde', 'Geschiedenis']),
  ('Beroep', ARRAY['Leraar', 'Arts']),
  ('Weer', ARRAY['Regen', 'Zon']),
  ('Kleding', ARRAY['Jas', 'T-shirt']),
  ('Hobby', ARRAY['Lezen', 'Gamen']),
  ('Koffie', ARRAY['Cappuccino', 'Espresso']),
  ('Social media', ARRAY['Instagram', 'TikTok']),
  ('Huisdier', ARRAY['Goudvis', 'Konijn']),
  ('Land', ARRAY['Frankrijk', 'Italië']),
  ('Gebouw', ARRAY['Wolkenkrabber', 'Kasteel']),
  ('Instrument', ARRAY['Drums', 'Viool']),
  ('Dans', ARRAY['Salsa', 'Ballet']),
  ('Streamer', ARRAY['Netflix', 'Disney+']),
  ('Game', ARRAY['Mario', 'FIFA']),
  ('Snack', ARRAY['Chips', 'Popcorn']),
  ('Groente', ARRAY['Broccoli', 'Wortel']),
  ('Bloem', ARRAY['Roos', 'Tulp']),
  ('Room', ARRAY['Slaapkamer', 'Keuken']),
  ('Meubel', ARRAY['Bank', 'Tafel']),
  ('Apparaat', ARRAY['Telefoon', 'Laptop']),
  ('Winkel', ARRAY['Supermarkt', 'Kledingwinkel']),
  ('Boek genre', ARRAY['Thriller', 'Romance']),
  ('Snoep', ARRAY['Chocola', 'Drop']),
  ('Brood', ARRAY['Wit', 'Volkoren']),
  ('Krant', ARRAY['De Telegraaf', 'Het Parool']),
  ('App', ARRAY['WhatsApp', 'Snapchat']),
  ('Feestdag', ARRAY['Kerst', 'Pasen']),
  ('Kaartspel', ARRAY['Poker', 'UNO']),
  ('IJssmaak', ARRAY['Vanille', 'Chocolade']);
