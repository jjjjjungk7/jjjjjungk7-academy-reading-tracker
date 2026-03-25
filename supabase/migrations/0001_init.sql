-- 0001_init.sql
-- Academy Reading Tracker initial schema

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  active bool NOT NULL DEFAULT true,
  memo text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  series text NULL,
  level_sort int NULL,
  volume_no int NULL,
  active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batch_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batch_action_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_action_id uuid NOT NULL REFERENCES batch_actions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  expected_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_action_id, student_id)
);

CREATE TABLE IF NOT EXISTS reading_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  expected_end_date date NOT NULL,
  end_date date NULL,
  status text NOT NULL DEFAULT 'in_progress',
  created_from_batch_action_id uuid NULL REFERENCES batch_actions(id) ON DELETE SET NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  reading_record_id uuid NULL REFERENCES reading_records(id) ON DELETE SET NULL,
  needed_by_date date NOT NULL,
  status text NOT NULL DEFAULT 'needed',
  ordered_at timestamptz NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY,
  banner_threshold_days int NOT NULL DEFAULT 7
);

INSERT INTO settings (id, banner_threshold_days)
VALUES (1, 7)
ON CONFLICT (id) DO NOTHING;

-- Indexes for banner query performance
CREATE INDEX IF NOT EXISTS idx_reading_records_status ON reading_records(status);
CREATE INDEX IF NOT EXISTS idx_reading_records_expected_end_date ON reading_records(expected_end_date);
CREATE INDEX IF NOT EXISTS idx_reading_records_student_id ON reading_records(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_book_orders_student_id ON book_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_book_orders_reading_record_id ON book_orders(reading_record_id);
CREATE INDEX IF NOT EXISTS idx_book_orders_status ON book_orders(status);

-- Enable RLS (service role bypasses RLS automatically)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_action_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for service role (app uses service role server-side)
-- Anon role gets read-only on all tables (restrict further in production)
CREATE POLICY "service_role_all" ON classes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON classes FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON students FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON students FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON books FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON books FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON batch_actions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON batch_actions FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON batch_action_students FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON batch_action_students FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON reading_records FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON reading_records FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON book_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON book_orders FOR SELECT TO anon USING (false);

CREATE POLICY "service_role_all" ON settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON settings FOR SELECT TO anon USING (false);
