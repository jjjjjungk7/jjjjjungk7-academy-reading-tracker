export interface Class {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  active: boolean;
  memo: string | null;
  created_at: string;
  classes?: Class;
}

export interface Book {
  id: string;
  title: string;
  series: string | null;
  level_sort: number | null;
  volume_no: number | null;
  active: boolean;
  created_at: string;
}

export interface BatchAction {
  id: string;
  class_id: string;
  book_id: string;
  start_date: string;
  note: string | null;
  created_at: string;
}

export interface BatchActionStudent {
  id: string;
  batch_action_id: string;
  student_id: string;
  expected_end_date: string;
  created_at: string;
}

export interface ReadingRecord {
  id: string;
  student_id: string;
  book_id: string;
  start_date: string;
  expected_end_date: string;
  end_date: string | null;
  status: 'in_progress' | 'completed' | 'paused';
  created_from_batch_action_id: string | null;
  note: string | null;
  created_at: string;
  books?: Book;
  students?: Student;
}

export interface BookOrder {
  id: string;
  student_id: string;
  book_id: string;
  reading_record_id: string | null;
  needed_by_date: string;
  status: 'needed' | 'ordered' | 'received' | 'canceled';
  ordered_at: string | null;
  note: string | null;
  created_at: string;
  books?: Book;
  students?: Student & { classes?: Class };
}

export interface Settings {
  id: number;
  banner_threshold_days: number;
}

export interface BannerItem {
  reading_record_id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  book_id: string;
  book_title: string;
  expected_end_date: string;
  days_remaining: number;
}
