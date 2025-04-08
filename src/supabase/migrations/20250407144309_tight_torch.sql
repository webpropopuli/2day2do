/*
  # Create tasks table for Priority Floater

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `text` (text, required) - The task description
      - `notes` (text) - Optional markdown notes for the task
      - `priority` (integer) - Task priority for ordering
      - `user_id` (uuid, required) - References auth.users
      - `created_at` (timestamptz) - Timestamp of task creation

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for:
      - Users can read their own tasks
      - Users can insert their own tasks
      - Users can update their own tasks
      - Users can delete their own tasks
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  notes text DEFAULT '',
  priority integer NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can read own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON public.tasks(created_at);