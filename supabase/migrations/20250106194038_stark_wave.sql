-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS app_password text,
ADD COLUMN IF NOT EXISTS remember_me boolean DEFAULT false;

-- Update RLS policies to protect password data
CREATE POLICY "Users can update own password"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);