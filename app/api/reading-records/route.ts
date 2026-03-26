import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { isAuthenticated } from '@/lib/auth';

const createRecordSchema = z.object({
  student_id: z.string().uuid(),
  book_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expected_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().nullish(),
});

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { student_id, book_id, start_date, expected_end_date, note } = parsed.data;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('reading_records')
    .insert({
      student_id,
      book_id,
      start_date,
      expected_end_date,
      note: note ?? null,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
