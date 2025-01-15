-- Drop existing insert policies
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;

-- Create new unrestricted insert policy for anon role
CREATE POLICY "Allow unrestricted inserts"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure anon role has required permissions
GRANT INSERT ON users TO anon;