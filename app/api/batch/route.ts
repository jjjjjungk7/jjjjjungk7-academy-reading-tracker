import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { isAuthenticated } from '@/lib/auth';

const batchStudentSchema = z.object({
  student_id: z.string().uuid(),
  expected_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createBatchSchema = z.object({
  class_id: z.string().uuid(),
  book_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  students: z.array(batchStudentSchema).min(1, 'At least one student is required'),
  note: z.string().nullish(),
});

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { class_id, book_id, start_date, students, note } = parsed.data;

  const supabase = createServerClient();

  // Create batch action
  const { data: batchAction, error: batchError } = await supabase
    .from('batch_actions')
    .insert({ class_id, book_id, start_date, note: note || null })
    .select()
    .single();

  if (batchError || !batchAction) {
    return NextResponse.json({ error: batchError?.message ?? 'Failed to create batch action' }, { status: 500 });
  }

  // Create batch_action_students rows
  const { error: basError } = await supabase.from('batch_action_students').insert(
    students.map((s) => ({
      batch_action_id: batchAction.id,
      student_id: s.student_id,
      expected_end_date: s.expected_end_date,
    }))
  );

  if (basError) {
    return NextResponse.json({ error: basError.message }, { status: 500 });
  }

  // Create reading_records for each student
  const { error: rrError } = await supabase.from('reading_records').insert(
    students.map((s) => ({
      student_id: s.student_id,
      book_id,
      start_date,
      expected_end_date: s.expected_end_date,
      status: 'in_progress',
      created_from_batch_action_id: batchAction.id,
    }))
  );

  if (rrError) {
    return NextResponse.json({ error: rrError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, batch_action_id: batchAction.id }, { status: 201 });
}
