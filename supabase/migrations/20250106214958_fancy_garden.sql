/*
  # Add Public Insert Policy for Users Table
  
  1. Changes
    - Add public INSERT policy to allow initial user creation
*/

-- Add public INSERT policy for users table
CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);