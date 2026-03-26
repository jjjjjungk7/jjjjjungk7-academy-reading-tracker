import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { isAuthenticated } from '@/lib/auth';

const createBookSchema = z.object({
  title: z.string().min(1, 'title is required'),
  series: z.string().nullish(),
  level_sort: z.coerce.number().int().nullish(),
  volume_no: z.coerce.number().int().nullish(),
});

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('series', { nullsFirst: false })
    .order('level_sort', { nullsFirst: false })
    .order('volume_no', { nullsFirst: false })
    .order('title');

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
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { title, series, level_sort, volume_no } = parsed.data;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('books')
    .insert({
      title,
      series: series ?? null,
      level_sort: level_sort ?? null,
      volume_no: volume_no ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
