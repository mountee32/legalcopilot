-- Create all tables for the template project

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    name text,
    image text,
    email_verified boolean DEFAULT false,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamp NOT NULL,
    token text NOT NULL UNIQUE,
    ip_address text,
    user_agent text,
    created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at timestamp,
    token_type text,
    scope text,
    id_token text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    data jsonb,
    status text DEFAULT 'pending' NOT NULL,
    result jsonb,
    error text,
    attempts text DEFAULT '0',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    completed_at timestamp
);

CREATE TABLE IF NOT EXISTS uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size text NOT NULL,
    bucket text NOT NULL,
    path text NOT NULL,
    url text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);
