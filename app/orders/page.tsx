import Navbar from '@/components/Navbar';
import { createServerClient } from '@/lib/supabase/server';
import OrdersClient from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; status?: string }>;
}) {
  const { class_id, status } = await searchParams;
  const supabase = createServerClient();

  const [{ data: classes }, { data: orders }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('active', true).order('name'),
    (async () => {
      let query = supabase
        .from('book_orders')
        .select(`
          *,
          books(id, title, series),
          students!inner(id, name, class_id, classes!inner(id, name))
        `)
        .order('needed_by_date', { ascending: true });

      if (status) query = query.eq('status', status);
      if (class_id) query = query.eq('students.class_id', class_id);

      return query;
    })(),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 주문 관리</h1>
        <OrdersClient
          initialOrders={orders ?? []}
          classes={classes ?? []}
          initialClassId={class_id ?? ''}
          initialStatus={status ?? ''}
        />
      </main>
    </>
  );
}
