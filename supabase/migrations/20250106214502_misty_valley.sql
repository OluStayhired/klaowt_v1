/*
  # Add Insert Policy for Users Table
  
  1. Changes
    - Add INSERT policy to allow creating new users
  
  2. Security
    - Maintains existing RLS security model
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);