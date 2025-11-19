-- Run this SQL query to check who is currently set as the admin

-- 1. Check the persisted first Firebase user UID
SELECT 'Current persisted admin UID:' as info, value as uid
FROM system_settings 
WHERE key = 'first_firebase_user_uid';

-- 2. Check which user has admin status in the database
SELECT 'Users with admin status:' as info, id, email, is_admin
FROM users 
WHERE is_admin = true;

-- 3. To reset and force re-detection, uncomment and run:
-- DELETE FROM system_settings WHERE key = 'first_firebase_user_uid';
-- UPDATE users SET is_admin = false WHERE is_admin = true;
-- Then restart the server and log in with the first Firebase user
