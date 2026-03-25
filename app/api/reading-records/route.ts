import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { student_id, book_id, start_date, expected_end_date, note } = body;

  if (!student_id || !book_id || !start_date || !expected_end_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('reading_records')
    .insert({
      student_id,
      book_id,
      start_date,
      expected_end_date,
      note: note || null,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
