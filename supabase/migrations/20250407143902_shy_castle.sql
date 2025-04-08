/*
  # Create tasks table with age tracking

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `text` (text)
      - `notes` (text)
      - `priority` (integer)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on tasks table
    - Add policies for authenticated users to:
      - Read their own tasks
      - Create their own tasks
      - Update their own tasks
      - Delete their own tasks
*/

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  notes text DEFAULT '',
  priority integer NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own tasks
CREATE POLICY "Users can read own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their own tasks
CREATE POLICY "Users can create own tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);