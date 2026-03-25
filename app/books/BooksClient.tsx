'use client';

import { useState } from 'react';

interface Book {
  id: string;
  title: string;
  series: string | null;
  level_sort: number | null;
  volume_no: number | null;
  active: boolean;
}

interface Props {
  initialBooks: Book[];
}

function emptyForm() {
  return { title: '', series: '', level_sort: '', volume_no: '' };
}

export default function BooksClient({ initialBooks }: Props) {
  const [books, setBooks] = useState(initialBooks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.series ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      series: book.series ?? '',
      level_sort: book.level_sort?.toString() ?? '',
      volume_no: book.volume_no?.toString() ?? '',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/books/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) { const d = await res.json(); alert(d.error); return; }
        const updated: Book = await res.json();
        setBooks((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
      } else {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) { const d = await res.json(); alert(d.error); return; }
        const created: Book = await res.json();
        setBooks((prev) => [...prev, created]);
      }
      cancelForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 도서를 삭제(비활성화)하시겠습니까?')) return;
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  // Group by series
  const grouped = filtered.reduce<Record<string, Book[]>>((acc, book) => {
    const key = book.series ?? '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(book);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="도서명 또는 시리즈 검색..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
        >
          + 도서 추가
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 space-y-3"
        >
          <h3 className="font-medium text-indigo-800">{editingId ? '도서 수정' : '새 도서 추가'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">도서명 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">시리즈</label>
              <input
                type="text"
                value={form.series}
                onChange={(e) => setForm({ ...form, series: e.target.value })}
                placeholder="예: Bricks Reading"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">레벨 (정렬용 숫자)</label>
              <input
                type="number"
                value={form.level_sort}
                onChange={(e) => setForm({ ...form, level_sort: e.target.value })}
                placeholder="예: 10, 20, 30"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">권번호</label>
              <input
                type="number"
                value={form.volume_no}
                onChange={(e) => setForm({ ...form, volume_no: e.target.value })}
                placeholder="예: 1, 2, 3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
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
              onClick={cancelForm}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {Object.entries(grouped).map(([series, seriesBooks]) => (
        <div key={series} className="mb-6">
          <h2 className="text-base font-semibold text-gray-600 mb-2">{series}</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">도서명</th>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">레벨</th>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">권</th>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {seriesBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800 font-medium">{book.title}</td>
                    <td className="px-4 py-2.5 text-gray-500">{book.level_sort ?? '-'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{book.volume_no ?? '-'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(book)}
                          className="text-xs px-2 py-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
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
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p>등록된 도서가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
