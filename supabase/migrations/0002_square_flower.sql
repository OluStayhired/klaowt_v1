/*
  # Feed Preferences Schema

  1. New Tables
    - `feed_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `feed_uri` (text) - Feed identifier
      - `is_pinned` (boolean) - Whether feed is pinned
      - `order` (integer) - Display order for pinned feeds
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on feed_preferences table
    - Add policies for authenticated users to manage their preferences
*/

-- Create feed_preferences table
CREATE TABLE IF NOT EXISTS feed_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_uri text NOT NULL,
  is_pinned boolean DEFAULT false,
  "order" integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feed_uri)
);

-- Enable RLS
ALTER TABLE feed_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own feed preferences"
  ON feed_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feed preferences"
  ON feed_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feed preferences"
  ON feed_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feed preferences"
  ON feed_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feed_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feed_preferences_updated_at
  BEFORE UPDATE ON feed_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_preferences_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_feed_preferences_user_id ON feed_preferences(user_id);
CREATE INDEX idx_feed_preferences_feed_uri ON feed_preferences(feed_uri);