import Link from 'next/link';
import Navbar from '@/components/Navbar';
import OrderBanner from '@/components/OrderBanner';
import { createServerClient } from '@/lib/supabase/server';
import { getBannerItems } from '@/lib/banner';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerClient();

  const [{ data: classes }, bannerItems] = await Promise.all([
    supabase.from('classes').select('*').eq('active', true).order('name'),
    getBannerItems(),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        <OrderBanner items={bannerItems} />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">반 목록</h1>
          <div className="flex gap-2">
            <Link
              href="/batch/start"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              📋 일괄 시작
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              🛒 주문 관리
            </Link>
          </div>
        </div>

        {!classes || classes.length === 0 ? (
          <div className="text-gray-500 text-center py-16">
            <p className="text-4xl mb-4">🏫</p>
            <p>등록된 반이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((cls) => {
              const classAlerts = bannerItems.filter((b) => b.class_id === cls.id).length;
              return (
                <Link
                  key={cls.id}
                  href={`/classes/${cls.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600">
                        {cls.name}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">반 대시보드 보기</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {classAlerts > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                          ⚠️ 주문 {classAlerts}건
                        </span>
                      )}
                      <span className="text-gray-300 text-xl group-hover:text-indigo-400">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/books" className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-600 font-medium">
            <span className="text-2xl mb-1">📖</span>도서 관리
          </Link>
          <Link href="/orders" className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-600 font-medium">
            <span className="text-2xl mb-1">🛒</span>주문 관리
          </Link>
          <Link href="/batch/start" className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-600 font-medium">
            <span className="text-2xl mb-1">📋</span>일괄 시작
          </Link>
          <Link href="/orders?status=needed" className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-600 font-medium">
            <span className="text-2xl mb-1">⚠️</span>주문 필요
          </Link>
        </div>
      </main>
    </>
  );
}
