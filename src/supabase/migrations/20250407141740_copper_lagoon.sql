/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `text` (text, required)
      - `notes` (text)
      - `priority` (integer, default: 0)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for authenticated users to:
      - Read their own tasks
      - Create their own tasks
      - Update their own tasks
      - Delete their own tasks
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    notes text,
    priority integer DEFAULT 0,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own tasks"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
    ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
    ON tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
    ON tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);