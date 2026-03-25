import Navbar from '@/components/Navbar';
import { createServerClient } from '@/lib/supabase/server';
import BooksClient from './BooksClient';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const supabase = createServerClient();
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('active', true)
    .order('series', { nullsFirst: false })
    .order('level_sort', { nullsFirst: false })
    .order('volume_no', { nullsFirst: false })
    .order('title');

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📖 도서 관리</h1>
        <BooksClient initialBooks={books ?? []} />
      </main>
    </>
  );
}
