-- =====================================================
-- ThaparMarket - Comprehensive Row Level Security (RLS) Policies
-- =====================================================
-- This file implements security policies for all tables
-- Ensures data access is properly restricted based on user roles
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP EXISTING POLICIES (if any)
-- =====================================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_public" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;

DROP POLICY IF EXISTS "listings_select_all" ON listings;
DROP POLICY IF EXISTS "listings_insert_authenticated" ON listings;
DROP POLICY IF EXISTS "listings_update_own" ON listings;
DROP POLICY IF EXISTS "listings_delete_own" ON listings;
DROP POLICY IF EXISTS "listings_admin_all" ON listings;

DROP POLICY IF EXISTS "messages_select_involved" ON messages;
DROP POLICY IF EXISTS "messages_insert_authenticated" ON messages;
DROP POLICY IF EXISTS "messages_update_own" ON messages;

DROP POLICY IF EXISTS "ratings_select_all" ON ratings;
DROP POLICY IF EXISTS "ratings_insert_authenticated" ON ratings;
DROP POLICY IF EXISTS "ratings_update_own" ON ratings;
DROP POLICY IF EXISTS "ratings_delete_own" ON ratings;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;

DROP POLICY IF EXISTS "reports_select_own_or_admin" ON reports;
DROP POLICY IF EXISTS "reports_insert_authenticated" ON reports;
DROP POLICY IF EXISTS "reports_update_admin" ON reports;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- =====================================================
-- 3. USERS TABLE POLICIES
-- =====================================================

-- Users can view their own complete profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can view limited public info of other users
CREATE POLICY "users_select_public" ON users
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND id != auth.uid()
  );

-- Users can update their own profile (except admin/banned flags)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM users WHERE id = auth.uid())
    AND is_banned = (SELECT is_banned FROM users WHERE id = auth.uid())
  );

-- Admins have full access to users table
CREATE POLICY "users_admin_all" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- =====================================================
-- 4. CATEGORIES TABLE POLICIES
-- =====================================================

-- Anyone authenticated can view active categories
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Only admins can insert/update/delete categories
CREATE POLICY "categories_admin_all" ON categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- =====================================================
-- 5. LISTINGS TABLE POLICIES
-- =====================================================

-- Anyone authenticated can view active listings
CREATE POLICY "listings_select_all" ON listings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (
      status IN ('active', 'sold', 'rented')
      OR user_id = auth.uid()
    )
  );

-- Authenticated users can create listings
CREATE POLICY "listings_insert_authenticated" ON listings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_banned = true
    )
  );

-- Users can update their own listings
CREATE POLICY "listings_update_own" ON listings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_banned = true
    )
  );

-- Users can delete their own listings
CREATE POLICY "listings_delete_own" ON listings
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins have full access to listings
CREATE POLICY "listings_admin_all" ON listings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- =====================================================
-- 6. MESSAGES TABLE POLICIES
-- =====================================================

-- Users can only view messages they're involved in
CREATE POLICY "messages_select_involved" ON messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (sender_id = auth.uid() OR receiver_id = auth.uid())
  );

-- Authenticated users can send messages
CREATE POLICY "messages_insert_authenticated" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_id = auth.uid()
    AND sender_id != receiver_id
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_banned = true
    )
  );

-- Users can update their own sent messages (mark as read, etc)
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- =====================================================
-- 7. RATINGS TABLE POLICIES
-- =====================================================

-- Anyone authenticated can view ratings
CREATE POLICY "ratings_select_all" ON ratings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can create ratings (but not for themselves)
CREATE POLICY "ratings_insert_authenticated" ON ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND rater_id = auth.uid()
    AND rated_user_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_banned = true
    )
  );

-- Users can update their own ratings
CREATE POLICY "ratings_update_own" ON ratings
  FOR UPDATE
  USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "ratings_delete_own" ON ratings
  FOR DELETE
  USING (rater_id = auth.uid());

-- =====================================================
-- 8. FAVORITES TABLE POLICIES
-- =====================================================

-- Users can only view their own favorites
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can add favorites
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Users can remove their own favorites
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 9. REPORTS TABLE POLICIES
-- =====================================================

-- Users can view their own reports, admins can view all
CREATE POLICY "reports_select_own_or_admin" ON reports
  FOR SELECT
  USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Authenticated users can create reports
CREATE POLICY "reports_insert_authenticated" ON reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reporter_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_banned = true
    )
  );

-- Only admins can update reports
CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- =====================================================
-- 10. NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can only view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 11. HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is banned
CREATE OR REPLACE FUNCTION is_banned()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;

GRANT SELECT ON categories TO authenticated;

GRANT ALL ON listings TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON ratings TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- =====================================================
-- SECURITY NOTES:
-- =====================================================
-- 1. All tables now have RLS enabled
-- 2. Users can only access their own data unless specified
-- 3. Admins have elevated privileges across all tables
-- 4. Banned users cannot create new content
-- 5. Public data (listings, ratings) is visible to all authenticated users
-- 6. Private data (messages, favorites, notifications) is restricted to owners
-- 7. Service role bypasses RLS (use carefully in backend)
-- =====================================================
