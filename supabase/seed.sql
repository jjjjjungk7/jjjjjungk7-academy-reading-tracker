-- Seed data for local development / testing

-- Classes
INSERT INTO classes (id, name) VALUES
  ('11111111-0000-0000-0000-000000000001', '월수금반'),
  ('11111111-0000-0000-0000-000000000002', '화목반');

-- Students for 월수금반
INSERT INTO students (class_id, name) VALUES
  ('11111111-0000-0000-0000-000000000001', '김민준'),
  ('11111111-0000-0000-0000-000000000001', '이서연'),
  ('11111111-0000-0000-0000-000000000001', '박지호'),
  ('11111111-0000-0000-0000-000000000001', '최아린'),
  ('11111111-0000-0000-0000-000000000001', '정우진');

-- Students for 화목반
INSERT INTO students (class_id, name) VALUES
  ('11111111-0000-0000-0000-000000000002', '한소율'),
  ('11111111-0000-0000-0000-000000000002', '오승현'),
  ('11111111-0000-0000-0000-000000000002', '신다은'),
  ('11111111-0000-0000-0000-000000000002', '임태양'),
  ('11111111-0000-0000-0000-000000000002', '강예린');

-- Books
INSERT INTO books (title, series, level_sort, volume_no) VALUES
  ('Bricks Reading 100-1', 'Bricks Reading', 10, 1),
  ('Bricks Reading 100-2', 'Bricks Reading', 10, 2),
  ('Bricks Reading 200-1', 'Bricks Reading', 20, 1),
  ('Bricks Reading 200-2', 'Bricks Reading', 20, 2),
  ('Reading Explorer 1A', 'Reading Explorer', 10, 1),
  ('Reading Explorer 1B', 'Reading Explorer', 10, 2),
  ('Reading Explorer 2A', 'Reading Explorer', 20, 1);
