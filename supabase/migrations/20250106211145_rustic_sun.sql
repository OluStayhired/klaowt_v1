/*
  # Modify Users Table Structure
  
  1. Changes
    - Modify id column from UUID to TEXT to support DID format
    - Drop and recreate policies to handle column type change
  
  2. Security
    - Recreate RLS policies with updated column type
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can update own password" ON users;

-- Modify id column type
ALTER TABLE users 
ALTER COLUMN id TYPE text;

-- Recreate policies with text id type
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own password"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);