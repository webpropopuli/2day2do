/*
  # Consolidated Tasks Schema

  1. Table Structure
    - Creates the tasks table with all necessary columns and constraints
    - Adds appropriate indexes for performance
  
  2. Security
    - Enables RLS
    - Sets up policies for CRUD operations
*/

-- Drop existing table and recreate from scratch
DROP TABLE IF EXISTS public.tasks;

-- Create tasks table with all constraints
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL CHECK (text <> ''),
  notes text DEFAULT '',
  priority integer DEFAULT 0 CHECK (priority >= 0),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_priority_idx ON public.tasks(priority);
CREATE INDEX tasks_created_at_idx ON public.tasks(created_at);