import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createServerClient } from '@/lib/supabase/server';
import StudentActions from './StudentActions';

export const dynamic = 'force-dynamic';

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const [
    { data: student },
    { data: inProgress },
    { data: completed },
    { data: books },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('*, classes(id, name)')
      .eq('id', id)
      .single(),
    supabase
      .from('reading_records')
      .select('*, books(id, title, series, volume_no)')
      .eq('student_id', id)
      .eq('status', 'in_progress')
      .is('end_date', null)
      .order('expected_end_date', { ascending: true }),
    supabase
      .from('reading_records')
      .select('*, books(id, title, series, volume_no)')
      .eq('student_id', id)
      .neq('status', 'in_progress')
      .order('end_date', { ascending: false })
      .limit(20),
    supabase.from('books').select('id, title, series, level_sort, volume_no').eq('active', true).order('series').order('level_sort').order('volume_no'),
  ]);

  if (!student) notFound();

  // Get orders for in-progress records
  const recordIds = (inProgress ?? []).map((r) => r.id);
  let orders: { reading_record_id: string | null; status: string }[] = [];
  if (recordIds.length > 0) {
    const { data } = await supabase
      .from('book_orders')
      .select('reading_record_id, status')
      .in('reading_record_id', recordIds);
    orders = data ?? [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = (student as any).classes as { id: string; name: string } | null;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-sm text-gray-400 hover:text-indigo-500">홈</Link>
          <span className="text-gray-300">/</span>
          {cls && (
            <>
              <Link href={`/classes/${cls.id}`} className="text-sm text-gray-400 hover:text-indigo-500">
                {cls.name}
              </Link>
              <span className="text-gray-300">/</span>
            </>
          )}
          <span className="text-sm text-gray-600">{student.name}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
            {cls && <p className="text-sm text-gray-500">{cls.name}</p>}
            {student.memo && <p className="text-sm text-gray-400 mt-1">{student.memo}</p>}
          </div>
        </div>

        {/* Student actions (create record, complete, create order) */}
        <StudentActions
          studentId={id}
          books={books ?? []}
          inProgressRecords={(inProgress ?? []).map(r => ({
            ...r,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            books: (r as any).books,
          }))}
          orders={orders}
        />

        {/* Completed records */}
        {completed && completed.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">✅ 완료 기록</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">도서</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">시작일</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">완료일</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completed.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(r as any).books?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.start_date}</td>
                      <td className="px-4 py-3 text-gray-500">{r.end_date ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status === 'completed' ? '완료' : r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
