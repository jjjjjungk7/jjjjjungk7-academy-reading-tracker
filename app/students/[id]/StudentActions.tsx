'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Book {
  id: string;
  title: string;
  series: string | null;
  level_sort: number | null;
  volume_no: number | null;
}

interface ReadingRecord {
  id: string;
  book_id: string;
  start_date: string;
  expected_end_date: string;
  status: string;
  note: string | null;
  books: Book | null;
}

interface Order {
  reading_record_id: string | null;
  status: string;
}

interface Props {
  studentId: string;
  books: Book[];
  inProgressRecords: ReadingRecord[];
  orders: Order[];
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export default function StudentActions({ studentId, books, inProgressRecords, orders }: Props) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRecord, setNewRecord] = useState({
    book_id: '',
    start_date: getTodayDateString(),
    expected_end_date: '',
    note: '',
  });

  const ordersByRecord = new Map(orders.map((o) => [o.reading_record_id, o.status]));

  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/reading-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, ...newRecord }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
        return;
      }
      setShowCreateForm(false);
      setNewRecord({ book_id: '', start_date: getTodayDateString(), expected_end_date: '', note: '' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(recordId: string) {
    if (!confirm('이 책을 완료 처리하시겠습니까?')) return;
    const res = await fetch(`/api/reading-records/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', end_date: getTodayDateString() }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '오류가 발생했습니다.');
      return;
    }
    router.refresh();
  }

  async function handleCreateOrder(record: ReadingRecord) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        book_id: record.book_id,
        reading_record_id: record.id,
        needed_by_date: record.expected_end_date,
        status: 'needed',
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '오류가 발생했습니다.');
      return;
    }
    router.refresh();
  }

  async function handleUpdateOrderStatus(record: ReadingRecord, newStatus: string) {
    const order = orders.find((o) => o.reading_record_id === record.id);
    if (!order) return;
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reading_record_id: record.id,
        student_id: studentId,
        status: newStatus,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '오류가 발생했습니다.');
      return;
    }
    router.refresh();
  }

  // Group books by series for the select
  const booksBySeries = books.reduce<Record<string, Book[]>>((acc, book) => {
    const key = book.series ?? '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(book);
    return acc;
  }, {});

  return (
    <div>
      {/* In-progress records */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">📖 진행중</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + 새 읽기 시작
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateRecord}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 space-y-3"
          >
            <h3 className="font-medium text-indigo-800">새 읽기 기록 추가</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">도서 선택 *</label>
              <select
                value={newRecord.book_id}
                onChange={(e) => setNewRecord({ ...newRecord, book_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              >
                <option value="">도서를 선택하세요</option>
                {Object.entries(booksBySeries).map(([series, seriesBooks]) => (
                  <optgroup key={series} label={series}>
                    {seriesBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                        {b.volume_no ? ` (Vol.${b.volume_no})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">시작일 *</label>
                <input
                  type="date"
                  value={newRecord.start_date}
                  onChange={(e) => setNewRecord({ ...newRecord, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">예상완료일 *</label>
                <input
                  type="date"
                  value={newRecord.expected_end_date}
                  onChange={(e) => setNewRecord({ ...newRecord, expected_end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">메모</label>
              <input
                type="text"
                value={newRecord.note}
                onChange={(e) => setNewRecord({ ...newRecord, note: e.target.value })}
                placeholder="선택사항"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {inProgressRecords.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-6 bg-white rounded-xl border border-gray-200">
            진행중인 책이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressRecords.map((record) => {
              const today = new Date();
              const expectedDate = new Date(record.expected_end_date);
              const daysLeft = Math.ceil(
                (expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              const orderStatus = ordersByRecord.get(record.id);

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{record.books?.title ?? record.book_id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        시작: {record.start_date} | 예상완료: {record.expected_end_date}
                        {daysLeft <= 7 && (
                          <span className={`ml-2 font-semibold ${daysLeft <= 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-red-500' : 'text-amber-600'}`}>
                            {daysLeft <= 0 ? '⚡ D+' + Math.abs(daysLeft) : `⚠️ D-${daysLeft}`}
                          </span>
                        )}
                      </p>
                      {record.note && <p className="text-xs text-gray-400 mt-1">{record.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {/* Order status */}
                      {!orderStatus ? (
                        <button
                          onClick={() => handleCreateOrder(record)}
                          className="text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                        >
                          주문 생성
                        </button>
                      ) : orderStatus === 'needed' ? (
                        <button
                          onClick={() => handleUpdateOrderStatus(record, 'ordered')}
                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded hover:bg-amber-200 transition-colors"
                        >
                          주문완료 처리
                        </button>
                      ) : orderStatus === 'ordered' ? (
                        <button
                          onClick={() => handleUpdateOrderStatus(record, 'received')}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                        >
                          입고 처리
                        </button>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                          ✓ 입고완료
                        </span>
                      )}
                      <button
                        onClick={() => handleComplete(record.id)}
                        className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
                      >
                        완료
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
