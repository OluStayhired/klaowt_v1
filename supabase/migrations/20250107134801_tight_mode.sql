-- Drop existing table and policies
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with UUID type
CREATE TABLE users (
  id UUID PRIMARY KEY, -- UUID type for app-generated IDs
  handle text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  app_password text,
  remember_me boolean DEFAULT false,
  last_login timestamptz,
  last_logout timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for all users"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for own rows"
  ON users FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;

-- Create indexes
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();