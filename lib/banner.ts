import { createServerClient } from './supabase/server';
import { BannerItem } from './types';

interface BannerRecord {
  id: string;
  expected_end_date: string;
  student_id: string;
  book_id: string;
  students: {
    id: string;
    name: string;
    class_id: string;
    classes: { id: string; name: string } | null;
  } | null;
  books: { id: string; title: string } | null;
}

/**
 * Fetch reading records that need an order:
 * - status = 'in_progress'
 * - expected_end_date within banner_threshold_days from today
 * - no book_order with status 'ordered' or 'received' for that record
 *
 * Optionally filter by class_id.
 */
export async function getBannerItems(classId?: string): Promise<BannerItem[]> {
  const supabase = createServerClient();

  // Get threshold
  const { data: settings } = await supabase
    .from('settings')
    .select('banner_threshold_days')
    .eq('id', 1)
    .single();

  const threshold = settings?.banner_threshold_days ?? 7;

  const today = new Date();
  const thresholdDate = new Date(today);
  thresholdDate.setDate(today.getDate() + threshold);
  const todayStr = today.toISOString().split('T')[0];
  const thresholdStr = thresholdDate.toISOString().split('T')[0];

  // Get in-progress records within threshold
  let query = supabase
    .from('reading_records')
    .select(`
      id,
      expected_end_date,
      student_id,
      book_id,
      students!inner(id, name, class_id, classes!inner(id, name)),
      books!inner(id, title)
    `)
    .eq('status', 'in_progress')
    .is('end_date', null)
    .lte('expected_end_date', thresholdStr)
    .gte('expected_end_date', todayStr);

  if (classId) {
    query = query.eq('students.class_id', classId);
  }

  const { data: records, error } = await query;
  if (error || !records) return [];

  // Get existing orders (ordered or received) for these records
  const recordIds = records.map((r) => r.id);
  if (recordIds.length === 0) return [];

  const { data: existingOrders } = await supabase
    .from('book_orders')
    .select('reading_record_id')
    .in('reading_record_id', recordIds)
    .in('status', ['ordered', 'received']);

  const orderedRecordIds = new Set(
    (existingOrders ?? []).map((o) => o.reading_record_id)
  );

  // Filter out already-ordered records and map to BannerItem
  const bannerItems: BannerItem[] = (records as unknown as BannerRecord[])
    .filter((r) => !orderedRecordIds.has(r.id))
    .map((r) => {
      const student = r.students;
      const book = r.books;
      const cls = student?.classes;

      const expectedDate = new Date(r.expected_end_date);
      const diffMs = expectedDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        reading_record_id: r.id,
        student_id: student?.id ?? '',
        student_name: student?.name ?? '',
        class_id: cls?.id ?? '',
        class_name: cls?.name ?? '',
        book_id: book?.id ?? '',
        book_title: book?.title ?? '',
        expected_end_date: r.expected_end_date,
        days_remaining: daysRemaining,
      };
    });

  return bannerItems.sort((a, b) => a.days_remaining - b.days_remaining);
}
