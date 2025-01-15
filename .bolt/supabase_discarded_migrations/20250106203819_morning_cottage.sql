-- Drop existing objects first to avoid conflicts
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Alter existing users table if needed
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_columns 
        WHERE tablename = 'users' 
        AND columnname = 'app_password'
    ) THEN
        ALTER TABLE users ADD COLUMN app_password text;
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_columns 
        WHERE tablename = 'users' 
        AND columnname = 'remember_me'
    ) THEN
        ALTER TABLE users ADD COLUMN remember_me boolean DEFAULT false;
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger function and trigger
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);