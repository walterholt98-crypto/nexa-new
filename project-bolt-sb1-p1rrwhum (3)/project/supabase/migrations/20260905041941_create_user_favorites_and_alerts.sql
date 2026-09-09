/*
# Create user_favorites and user_alerts tables

1. New Tables
- `user_favorites`: stores a logged-in user's favorite coin symbols.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade on delete)
  - `symbol` (text, not null, e.g. "BTCUSDT")
  - `created_at` (timestamptz, default now())
  - Unique constraint on (user_id, symbol) so a user can't favorite the same coin twice.
- `user_alerts`: stores a logged-in user's price alerts (mirrors the client-side Alert type).
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade on delete)
  - `symbol` (text, not null)
  - `target_price` (numeric, not null)
  - `direction` (text, not null, check in 'above','below')
  - `note` (text, nullable)
  - `triggered` (boolean, default false)
  - `triggered_at` (timestamptz, nullable)
  - `created_at` (timestamptz, default now())

2. Indexes
- `user_favorites_user_id_idx` on user_favorites(user_id) for per-user listing.
- `user_alerts_user_id_idx` on user_alerts(user_id) for per-user listing.

3. Security — Row Level Security
- Enable RLS on both tables.
- Both tables are owner-scoped (TO authenticated): a user can only read/insert/update/delete their own rows.
- `user_id` defaults to auth.uid() so inserts that omit user_id still satisfy the WITH CHECK.
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE), no FOR ALL.
*/

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  target_price numeric NOT NULL,
  direction text NOT NULL CHECK (direction IN ('above', 'below')),
  note text,
  triggered boolean NOT NULL DEFAULT false,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_alerts_user_id_idx ON user_alerts(user_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- user_favorites policies
DROP POLICY IF EXISTS "select_own_favorites" ON user_favorites;
CREATE POLICY "select_own_favorites" ON user_favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON user_favorites;
CREATE POLICY "insert_own_favorites" ON user_favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_favorites" ON user_favorites;
CREATE POLICY "update_own_favorites" ON user_favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON user_favorites;
CREATE POLICY "delete_own_favorites" ON user_favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- user_alerts policies
DROP POLICY IF EXISTS "select_own_alerts" ON user_alerts;
CREATE POLICY "select_own_alerts" ON user_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON user_alerts;
CREATE POLICY "insert_own_alerts" ON user_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_alerts" ON user_alerts;
CREATE POLICY "update_own_alerts" ON user_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_alerts" ON user_alerts;
CREATE POLICY "delete_own_alerts" ON user_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
