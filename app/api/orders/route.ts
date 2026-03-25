import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');
  const status = searchParams.get('status');

  const supabase = createServerClient();

  let query = supabase
    .from('book_orders')
    .select(`
      *,
      books(id, title, series),
      students!inner(id, name, class_id, classes!inner(id, name))
    `)
    .order('needed_by_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  if (classId) {
    query = query.eq('students.class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { student_id, book_id, reading_record_id, needed_by_date, status, note } = body;

  if (!student_id || !book_id || !needed_by_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('book_orders')
    .insert({
      student_id,
      book_id,
      reading_record_id: reading_record_id || null,
      needed_by_date,
      status: status ?? 'needed',
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { reading_record_id, student_id, status } = body;

  if (!status) {
    return NextResponse.json({ error: 'status required' }, { status: 400 });
  }

  const supabase = createServerClient();

  let query = supabase.from('book_orders').update({
    status,
    ordered_at: status === 'ordered' ? new Date().toISOString() : undefined,
  });

  if (reading_record_id) {
    query = query.eq('reading_record_id', reading_record_id);
  } else if (student_id) {
    query = query.eq('student_id', student_id);
  } else {
    return NextResponse.json({ error: 'reading_record_id or student_id required' }, { status: 400 });
  }

  const { data, error } = await query.select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
