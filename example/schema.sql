-- Better Auth database schema for D1
-- This creates the necessary tables for better-auth

-- Users table
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    name TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    image TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Accounts table (for OAuth providers)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt INTEGER,
    password TEXT,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);