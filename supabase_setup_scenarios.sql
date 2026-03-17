-- SQL Migration to create Scenarios and related tables

CREATE TABLE IF NOT EXISTS public.scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text,
  topic text,
  source_type text default 'fixed',
  prompt_seed text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.scenario_turns (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  turn_order integer not null,
  speaker text not null,
  source_language text not null,
  source_text text not null,
  target_reference_text text,
  key_terms_json jsonb,
  difficulty text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.user_scenario_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- nullable for anonymous users
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  final_score numeric(5,2),
  completeness_score numeric(5,2),
  terminology_score numeric(5,2),
  fluency_score numeric(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.user_scenario_turn_attempts (
  id uuid primary key default gen_random_uuid(),
  scenario_attempt_id uuid references public.user_scenario_attempts(id) on delete cascade not null,
  turn_id uuid references public.scenario_turns(id) on delete cascade not null,
  spoken_text text,
  score numeric(5,2),
  feedback_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id uuid primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date
);

-- Note: Since we don't force auth yet, streaks can just use a dummy UUID or we can rely on local storage for the MVP.
-- If user_id is the primary key and we don't have auth, streaks might be tricky. Let's make user_id text just in case.
