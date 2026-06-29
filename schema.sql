-- SQL Schema to create tables in your new Supabase database
-- Paste this script into your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Maps to interviewee or recruiter profile ID (can be user auth UUID or custom ID)
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('recruiter', 'interviewee', 'admin')),
    company_name TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.interviews (
    id TEXT PRIMARY KEY,
    recruiter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_role TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    title TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    interview_id TEXT NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    interview_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    candidate_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned', 'terminated_early')),
    decision TEXT NOT NULL CHECK (decision IN ('pending', 'passed', 'failed')) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT
);

-- 4. RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.responses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.evaluations (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
    overall_score NUMERIC NOT NULL,
    parameter_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- CREATE INDEXES FOR FAST QUERIES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_interviews_code ON public.interviews(code);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter ON public.interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_sessions_candidate ON public.sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_sessions_interview ON public.sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON public.responses(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_response ON public.evaluations(response_id);

-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS BY DEFAULT
-- (Since the app currently uses client-side queries without native supabase auth sign-in tokens, 
--  allowing public reads/writes is required to match your client-side implementation.
--  If you wish to secure your app further in production, you can implement Supabase Auth 
--  and restrict policies to authenticated users.)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for easy client-side operations (no auth required)
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select on interviews" ON public.interviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert on interviews" ON public.interviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on interviews" ON public.interviews FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on interviews" ON public.interviews FOR DELETE USING (true);

CREATE POLICY "Allow public select on sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sessions" ON public.sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public select on responses" ON public.responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on responses" ON public.responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on evaluations" ON public.evaluations FOR INSERT WITH CHECK (true);
