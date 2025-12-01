-- ============================================
-- ServiceLoop Database Schema
-- Complete SQL Template to Replicate Database
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. NONPROFITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nonprofits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  mission TEXT,
  category TEXT,
  contact_email TEXT,
  website TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on nonprofits
ALTER TABLE nonprofits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nonprofits
CREATE POLICY "Anyone can view nonprofits" ON nonprofits
  FOR SELECT USING (true);

CREATE POLICY "Super admins can insert nonprofits" ON nonprofits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

CREATE POLICY "Org admins can update their nonprofits" ON nonprofits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_admins
      WHERE organization_admins.nonprofit_id = nonprofits.id
      AND organization_admins.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

CREATE POLICY "Super admins can delete nonprofits" ON nonprofits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 3. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Org admins can insert events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_admins
      WHERE organization_admins.nonprofit_id = events.nonprofit_id
      AND organization_admins.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

CREATE POLICY "Org admins can update their events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_admins
      WHERE organization_admins.nonprofit_id = events.nonprofit_id
      AND organization_admins.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

CREATE POLICY "Org admins can delete their events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_admins
      WHERE organization_admins.nonprofit_id = events.nonprofit_id
      AND organization_admins.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 4. POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Anyone can view posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 5. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 6. VOLUNTEER_SIGNUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on volunteer_signups
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for volunteer_signups
CREATE POLICY "Users can view all signups" ON volunteer_signups
  FOR SELECT USING (true);

CREATE POLICY "Users can sign up for events" ON volunteer_signups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own signups" ON volunteer_signups
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. NONPROFIT_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nonprofit_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nonprofit_id, user_id)
);

-- Enable RLS on nonprofit_members
ALTER TABLE nonprofit_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nonprofit_members
CREATE POLICY "Anyone can view members" ON nonprofit_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join organizations" ON nonprofit_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave organizations" ON nonprofit_members
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 8. ORGANIZATION_ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organization_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(nonprofit_id, user_id)
);

-- Enable RLS on organization_admins
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_admins
CREATE POLICY "Anyone can view organization admins" ON organization_admins
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage organization admins" ON organization_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 9. ORG_CREATION_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS org_creation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  org_mission TEXT,
  org_category TEXT,
  org_contact_email TEXT,
  org_website TEXT,
  status TEXT DEFAULT 'pending',
  reviewer_id UUID REFERENCES profiles(id),
  reviewer_email TEXT,
  review_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on org_creation_requests
ALTER TABLE org_creation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_creation_requests
CREATE POLICY "Users can view their own requests" ON org_creation_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

CREATE POLICY "Users can create requests" ON org_creation_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can update requests" ON org_creation_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 10. ADMIN_ACTIONS_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_email TEXT,
  action_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_actions_log
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_actions_log
CREATE POLICY "Super admins can view all logs" ON admin_actions_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

CREATE POLICY "Super admins can insert logs" ON admin_actions_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jeevanparajuli856@gmail.com'
    )
  );

-- ============================================
-- 11. CHAT_MESSAGES TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function: Check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(
  user_id_param UUID,
  nonprofit_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin is always an admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id_param
    AND email = 'jeevanparajuli856@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user is in organization_admins table
  RETURN EXISTS (
    SELECT 1 FROM organization_admins
    WHERE user_id = user_id_param
    AND nonprofit_id = nonprofit_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all admins for an organization
CREATE OR REPLACE FUNCTION get_org_admins(
  nonprofit_id_param UUID
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oa.user_id,
    p.email,
    p.full_name,
    oa.created_at
  FROM organization_admins oa
  JOIN profiles p ON p.id = oa.user_id
  WHERE oa.nonprofit_id = nonprofit_id_param
  ORDER BY oa.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add admin by email
CREATE OR REPLACE FUNCTION add_admin_by_email(
  email_param TEXT,
  nonprofit_id_param UUID,
  added_by UUID
)
RETURNS UUID AS $$
DECLARE
  user_id_found UUID;
BEGIN
  -- Find user by email
  SELECT id INTO user_id_found
  FROM profiles
  WHERE email = email_param;

  IF user_id_found IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_param;
  END IF;

  -- Insert into organization_admins (ignore if already exists)
  INSERT INTO organization_admins (user_id, nonprofit_id, created_by)
  VALUES (user_id_found, nonprofit_id_param, added_by)
  ON CONFLICT (nonprofit_id, user_id) DO NOTHING;

  RETURN user_id_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Remove admin
CREATE OR REPLACE FUNCTION remove_admin(
  user_id_param UUID,
  nonprofit_id_param UUID,
  removed_by UUID
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM organization_admins
  WHERE user_id = user_id_param
  AND nonprofit_id = nonprofit_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve organization creation request
CREATE OR REPLACE FUNCTION approve_org_request(
  request_id UUID,
  reviewer_id UUID,
  reviewer_email TEXT
)
RETURNS UUID AS $$
DECLARE
  new_nonprofit_id UUID;
  requester_user_id UUID;
BEGIN
  -- Get requester user_id
  SELECT user_id INTO requester_user_id
  FROM org_creation_requests
  WHERE id = request_id;

  IF requester_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Create the nonprofit
  INSERT INTO nonprofits (
    name,
    mission,
    category,
    contact_email,
    website
  )
  SELECT
    org_name,
    org_mission,
    org_category,
    org_contact_email,
    org_website
  FROM org_creation_requests
  WHERE id = request_id
  RETURNING id INTO new_nonprofit_id;

  -- Add requester as organization admin
  INSERT INTO organization_admins (user_id, nonprofit_id, created_by)
  VALUES (requester_user_id, new_nonprofit_id, reviewer_id)
  ON CONFLICT (nonprofit_id, user_id) DO NOTHING;

  -- Update request status
  UPDATE org_creation_requests
  SET 
    status = 'approved',
    reviewer_id = reviewer_id,
    reviewer_email = reviewer_email,
    reviewed_at = NOW()
  WHERE id = request_id;

  RETURN new_nonprofit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject organization creation request
CREATE OR REPLACE FUNCTION reject_org_request(
  request_id UUID,
  reviewer_id UUID,
  reviewer_email TEXT,
  comment TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE org_creation_requests
  SET 
    status = 'rejected',
    reviewer_id = reviewer_id,
    reviewer_email = reviewer_email,
    review_comment = comment,
    reviewed_at = NOW()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Nonprofits indexes
CREATE INDEX IF NOT EXISTS idx_nonprofits_category ON nonprofits(category);
CREATE INDEX IF NOT EXISTS idx_nonprofits_created_at ON nonprofits(created_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_nonprofit_id ON events(nonprofit_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Volunteer signups indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_event_id ON volunteer_signups(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_user_id ON volunteer_signups(user_id);

-- Nonprofit members indexes
CREATE INDEX IF NOT EXISTS idx_nonprofit_members_nonprofit_id ON nonprofit_members(nonprofit_id);
CREATE INDEX IF NOT EXISTS idx_nonprofit_members_user_id ON nonprofit_members(user_id);

-- Organization admins indexes
CREATE INDEX IF NOT EXISTS idx_organization_admins_nonprofit_id ON organization_admins(nonprofit_id);
CREATE INDEX IF NOT EXISTS idx_organization_admins_user_id ON organization_admins(user_id);

-- Org creation requests indexes
CREATE INDEX IF NOT EXISTS idx_org_creation_requests_user_id ON org_creation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_org_creation_requests_status ON org_creation_requests(status);

-- Admin actions log indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_performed_by ON admin_actions_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_created_at ON admin_actions_log(created_at);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'ServiceLoop database schema created successfully!';
  RAISE NOTICE 'All tables, RLS policies, functions, and indexes have been set up.';
END $$;

