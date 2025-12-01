-- Add current_round column to games table to track round numbers
ALTER TABLE public.games
ADD COLUMN current_round INTEGER NOT NULL DEFAULT 1;