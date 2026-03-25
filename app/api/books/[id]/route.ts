import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isAuthenticated } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, series, level_sort, volume_no, active } = body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (series !== undefined) updates.series = series || null;
  if (level_sort !== undefined) updates.level_sort = level_sort ? Number(level_sort) : null;
  if (volume_no !== undefined) updates.volume_no = volume_no ? Number(volume_no) : null;
  if (active !== undefined) updates.active = active;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  // Soft delete
  const { error } = await supabase
    .from('books')
    .update({ active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
