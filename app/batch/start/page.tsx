import Navbar from '@/components/Navbar';
import { createServerClient } from '@/lib/supabase/server';
import BatchStartClient from './BatchStartClient';

export const dynamic = 'force-dynamic';

export default async function BatchStartPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string }>;
}) {
  const { class_id } = await searchParams;
  const supabase = createServerClient();

  const [{ data: classes }, { data: books }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('active', true).order('name'),
    supabase
      .from('books')
      .select('id, title, series, level_sort, volume_no')
      .eq('active', true)
      .order('series', { nullsFirst: false })
      .order('level_sort', { nullsFirst: false })
      .order('volume_no', { nullsFirst: false }),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 일괄 읽기 시작</h1>
        <BatchStartClient
          classes={classes ?? []}
          books={books ?? []}
          initialClassId={class_id ?? ''}
        />
      </main>
    </>
  );
}
