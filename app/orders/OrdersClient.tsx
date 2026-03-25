'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Book { id: string; title: string; series: string | null }
interface Cls { id: string; name: string }
interface Student { id: string; name: string; class_id: string; classes: Cls }
interface Order {
  id: string;
  student_id: string;
  book_id: string;
  reading_record_id: string | null;
  needed_by_date: string;
  status: string;
  ordered_at: string | null;
  note: string | null;
  books: Book | null;
  students: Student;
}

const STATUS_LABELS: Record<string, string> = {
  needed: '주문 필요',
  ordered: '주문 완료',
  received: '입고 완료',
  canceled: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  needed: 'bg-amber-100 text-amber-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  canceled: 'bg-gray-100 text-gray-500',
};

interface Props {
  initialOrders: Order[];
  classes: Cls[];
  initialClassId: string;
  initialStatus: string;
}

export default function OrdersClient({ initialOrders, classes, initialClassId, initialStatus }: Props) {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);

  function applyFilters(classId: string, status: string) {
    setSelectedClass(classId);
    setSelectedStatus(status);
    const params = new URLSearchParams();
    if (classId) params.set('class_id', classId);
    if (status) params.set('status', status);
    router.push(`/orders${params.toString() ? '?' + params.toString() : ''}`);
  }

  async function handleStatusChange(order: Order, newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm('이 주문을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '오류가 발생했습니다.');
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedClass}
          onChange={(e) => applyFilters(e.target.value, selectedStatus)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">전체 반</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => applyFilters(selectedClass, e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => applyFilters('', '')}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          필터 초기화
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>주문 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">학생</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">반</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">도서</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">필요일</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/students/${order.student_id}`}
                      className="font-medium text-gray-800 hover:text-indigo-600"
                    >
                      {order.students?.name ?? '-'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.students?.classes?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{order.books?.title ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{order.needed_by_date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {order.status === 'needed' && (
                        <button
                          onClick={() => handleStatusChange(order, 'ordered')}
                          disabled={loading}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          주문완료
                        </button>
                      )}
                      {order.status === 'ordered' && (
                        <button
                          onClick={() => handleStatusChange(order, 'received')}
                          disabled={loading}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          입고
                        </button>
                      )}
                      {order.status !== 'canceled' && order.status !== 'received' && (
                        <button
                          onClick={() => handleStatusChange(order, 'canceled')}
                          disabled={loading}
                          className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                          취소
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-xs px-2 py-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
