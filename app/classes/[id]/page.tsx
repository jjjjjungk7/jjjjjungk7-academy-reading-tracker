import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import OrderBanner from '@/components/OrderBanner';
import { createServerClient } from '@/lib/supabase/server';
import { getBannerItems } from '@/lib/banner';
import { fetchGoogleReadingLogs, fetchGoogleStudents, groupLogsByStudentInClass } from '@/lib/googleSheetsCsv';
export const dynamic = 'force-dynamic';

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const [
    { data: cls },
    { data: students },
    bannerItems,
  ] = await Promise.all([
   const [
  { data: cls },
  { data: students },
  bannerItems,
  googleStudents,
  googleLogs,
] = await Promise.all([
  supabase.from('classes').select('*').eq('id', id).single(),
  supabase.from('students').select('*').eq('class_id', id).eq('active', true).order('name'),
  getBannerItems(id),
  fetchGoogleStudents(),
  fetchGoogleReadingLogs(),
]);

  if (!cls) notFound();

  // Get upcoming completions (in_progress, expected_end_date in next 14 days)
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  const today = new Date().toISOString().split('T')[0];
  const twoWeeksStr = twoWeeksLater.toISOString().split('T')[0];

  const studentIds = (students ?? []).map((s) => s.id);

  let upcoming: {
    id: string;
    student_id: string;
    book_id: string;
    expected_end_date: string;
    students: { name: string } | null;
    books: { title: string } | null;
  }[] = [];

  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('reading_records')
      .select('id, student_id, book_id, expected_end_date, students(name), books(title)')
      .in('student_id', studentIds)
      .eq('status', 'in_progress')
      .is('end_date', null)
      .gte('expected_end_date', today)
      .lte('expected_end_date', twoWeeksStr)
      .order('expected_end_date', { ascending: true });

    upcoming = (data ?? []) as unknown as typeof upcoming;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-sm text-gray-400 hover:text-indigo-500">홈</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">{cls.name}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{cls.name}</h1>
          <Link
            href={`/batch/start?class_id=${cls.id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            📋 일괄 시작
          </Link>
        </div>

        <OrderBanner items={bannerItems} />

        {/* Upcoming completions */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">📅 14일 이내 완료 예정</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">학생</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">도서</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">예상완료일</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">D-day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {upcoming.map((r) => {
                    const diff = Math.ceil(
                      (new Date(r.expected_end_date).getTime() - new Date(today).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <Link href={`/students/${r.student_id}`} className="hover:text-indigo-600">
                            {r.students?.name ?? '-'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.books?.title ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{r.expected_end_date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              diff <= 3 ? 'text-red-600' : diff <= 7 ? 'text-amber-600' : 'text-gray-500'
                            }`}
                          >
                            D-{diff}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

{/* Students list */}
<div>
  <h2 ...>👥 학생 목록</h2>
  {!students || students.length === 0 ? (
    ...
  ) : (
    <div ...>
      {students.map((student) => ( ... ))}
    </div>
  )}
</div>
                    </span>
                    <div className="flex items-center gap-2">
                      {alerts > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                          ⚠️{alerts}
                        </span>
                      )}
                      <span className="text-gray-300 group-hover:text-indigo-400">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
