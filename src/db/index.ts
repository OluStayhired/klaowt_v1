import Database from 'better-sqlite3';
import { join } from 'path';

// Initialize database
const db = new Database(join(process.cwd(), 'users.db'));

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    last_login DATETIME,
    last_logout DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
`);

// Prepare statements
const insertUser = db.prepare(`
  INSERT INTO users (id, name, handle, last_login)
  VALUES (@id, @name, @handle, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    last_login = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
`);

const updateLastLogout = db.prepare(`
  UPDATE users 
  SET last_logout = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const getUser = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

export interface User {
  id: string;
  name: string;
  handle: string;
  last_login: string;
  last_logout: string | null;
  created_at: string;
  updated_at: string;
}

export const dbOperations = {
  // Create or update user on login
  createOrUpdateUser: (id: string, name: string, handle: string) => {
    return insertUser.run({ id, name, handle });
  },

  // Update last logout time
  updateLogout: (id: string) => {
    return updateLastLogout.run(id);
  },

  // Get user by ID
  getUser: (id: string): User | undefined => {
    return getUser.get(id) as User | undefined;
  }
};