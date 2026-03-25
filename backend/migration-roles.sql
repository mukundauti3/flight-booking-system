-- 1. Create user_roles join table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 2. Migrate existing data from users.role_id (Single role)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users;

-- 3. Explanation: 
-- This handles the transition by preserving current assignments.
-- Once the backend is updated to use user_roles, 
-- the users.role_id column can be safely ignored or dropped.
