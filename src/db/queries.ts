import { db } from './index';

// Get all users who have logged in, ordered by most recent login
export const getLoggedInUsers = () => {
  return db.prepare(`
    SELECT 
      name,
      handle,
      last_login,
      last_logout,
      CASE 
        WHEN last_logout IS NULL OR last_login > last_logout 
        THEN 1 
        ELSE 0 
      END as is_active
    FROM users
    ORDER BY last_login DESC
  `).all();
};

// Get currently active users (logged in but not logged out)
export const getActiveUsers = () => {
  return db.prepare(`
    SELECT 
      name,
      handle,
      last_login
    FROM users 
    WHERE last_logout IS NULL 
       OR last_login > last_logout
    ORDER BY last_login DESC
  `).all();
};

// Get login history for a specific user
export const getUserLoginHistory = (handle: string) => {
  return db.prepare(`
    SELECT 
      last_login,
      last_logout,
      ROUND((JULIANDAY(COALESCE(last_logout, CURRENT_TIMESTAMP)) - 
             JULIANDAY(last_login)) * 24 * 60, 0) as session_minutes
    FROM users
    WHERE handle = ?
    ORDER BY last_login DESC
  `).all(handle);
};