-- ========================================
-- HOUSES SYSTEM DATABASE SCHEMA
-- Sistema de Casas para UETS
-- ========================================

-- Table: houses
-- Stores information about each house
CREATE TABLE IF NOT EXISTS public.houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text NOT NULL, -- Hex color code for embeds
  emoji text, -- Emoji representing the house
  points bigint NOT NULL DEFAULT 0, -- Total cumulative points
  createdAt timestamp with time zone DEFAULT now()
);

-- Table: house_members
-- Tracks which users belong to which houses
CREATE TABLE IF NOT EXISTS public.house_members (
  userId text NOT NULL,
  username text NOT NULL,
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- 'member', 'event_organizer', 'leader'
  joinedAt timestamp with time zone DEFAULT now(),
  PRIMARY KEY (userId, houseId)
);

-- Table: fragmentos
-- Tracks fragmentos (house currency) for each user
CREATE TABLE IF NOT EXISTS public.fragmentos (
  userId text PRIMARY KEY,
  amount bigint NOT NULL DEFAULT 0,
  houseId uuid REFERENCES public.houses(id) ON DELETE SET NULL,
  updatedAt timestamp with time zone DEFAULT now()
);

-- Table: house_points
-- Tracks monthly points per user per house
CREATE TABLE IF NOT EXISTS public.house_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userId text NOT NULL,
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  points bigint NOT NULL DEFAULT 0,
  month integer NOT NULL, -- 1-12
  year integer NOT NULL,
  updatedAt timestamp with time zone DEFAULT now(),
  UNIQUE(userId, houseId, month, year)
);

-- Table: house_achievements
-- Tracks achievements/badges earned by users
CREATE TABLE IF NOT EXISTS public.house_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userId text NOT NULL,
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  achievementType text NOT NULL, -- 'event_participation', 'mentor', 'organizer', 'honor_seal', etc.
  metadata jsonb, -- Additional data about the achievement
  awardedAt timestamp with time zone DEFAULT now()
);

-- Table: house_alliances
-- Tracks temporary alliances between houses
CREATE TABLE IF NOT EXISTS public.house_alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house1Id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  house2Id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  startDate timestamp with time zone NOT NULL,
  endDate timestamp with time zone NOT NULL,
  active boolean DEFAULT true,
  createdAt timestamp with time zone DEFAULT now(),
  CHECK (house1Id != house2Id)
);

-- Table: house_events
-- Tracks inter-house events
CREATE TABLE IF NOT EXISTS public.house_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  eventType text NOT NULL, -- 'hackathon', 'tournament', 'challenge', 'collaborative'
  organizerId text NOT NULL, -- Discord user ID of organizer
  startDate timestamp with time zone NOT NULL,
  endDate timestamp with time zone,
  pointsReward bigint DEFAULT 0,
  active boolean DEFAULT true,
  createdAt timestamp with time zone DEFAULT now()
);

-- Table: house_event_participants
-- Tracks which houses/users participate in events
CREATE TABLE IF NOT EXISTS public.house_event_participants (
  eventId uuid NOT NULL REFERENCES public.house_events(id) ON DELETE CASCADE,
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  userId text NOT NULL,
  pointsEarned bigint DEFAULT 0,
  joinedAt timestamp with time zone DEFAULT now(),
  PRIMARY KEY (eventId, userId)
);

-- Table: mentors
-- Tracks users registered as mentors
CREATE TABLE IF NOT EXISTS public.mentors (
  mentorId text PRIMARY KEY,
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  availability text, -- JSON or text describing availability
  curso curso_enum NOT NULL, -- Must be '2E1', '2E2', '3E1', or '3E2'
  certified boolean DEFAULT false,
  registeredAt timestamp with time zone DEFAULT now()
);

-- Table: mentorship_sessions
-- Tracks mentorship sessions between mentors and mentees
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorId text NOT NULL REFERENCES public.mentors(mentorId) ON DELETE CASCADE,
  menteeId text NOT NULL,
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  certifiedByLeader boolean DEFAULT false,
  startedAt timestamp with time zone DEFAULT now(),
  completedAt timestamp with time zone
);

-- Table: house_history
-- Tracks historical events and achievements for each house (El Libro de las Casas)
CREATE TABLE IF NOT EXISTS public.house_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  houseId uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  eventType text NOT NULL, -- 'event_win', 'new_member', 'alliance', 'achievement', etc.
  description text NOT NULL,
  date timestamp with time zone DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_house_members_house ON public.house_members(houseId);
CREATE INDEX IF NOT EXISTS idx_house_members_user ON public.house_members(userId);
CREATE INDEX IF NOT EXISTS idx_house_points_house ON public.house_points(houseId);
CREATE INDEX IF NOT EXISTS idx_house_points_month ON public.house_points(month, year);
CREATE INDEX IF NOT EXISTS idx_house_achievements_user ON public.house_achievements(userId);
CREATE INDEX IF NOT EXISTS idx_house_alliances_houses ON public.house_alliances(house1Id, house2Id);
CREATE INDEX IF NOT EXISTS idx_house_history_house ON public.house_history(houseId);
CREATE INDEX IF NOT EXISTS idx_mentors_house ON public.mentors(houseId);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentor ON public.mentorship_sessions(mentorId);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentee ON public.mentorship_sessions(menteeId);

-- Row Level Security (Optional - enable if needed)
-- ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.house_members ENABLE ROW LEVEL SECURITY;
-- ... etc for other tables

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON public.houses TO anon, authenticated;
-- GRANT ALL ON public.house_members TO anon, authenticated;
-- ... etc for other tables
