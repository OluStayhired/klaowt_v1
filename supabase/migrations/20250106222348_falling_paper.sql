/*
  # Fix RLS Permissions
  
  1. Changes
    - Ensure RLS is enabled
    - Grant INSERT permission to anon role
*/

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant INSERT permission to anon role
GRANT INSERT ON users TO anon;