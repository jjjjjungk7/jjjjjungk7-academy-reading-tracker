'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Cls { id: string; name: string }
interface Book {
  id: string;
  title: string;
  series: string | null;
  level_sort: number | null;
  volume_no: number | null;
}
interface Student { id: string; name: string; class_id: string }

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

interface Props {
  classes: Cls[];
  books: Book[];
  initialClassId: string;
}

export default function BatchStartClient({ classes, books, initialClassId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(todayStr());
  const [fillDate, setFillDate] = useState('');
  const [studentDates, setStudentDates] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    fetch(`/api/students?class_id=${selectedClassId}`)
      .then((r) => r.json())
      .then((data: Student[]) => {
        setStudents(data);
        setSelectedStudentIds(new Set(data.map((s) => s.id)));
        setStudentDates({});
      })
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function fillAllDates() {
    if (!fillDate) return;
    const updated: Record<string, string> = {};
    students
      .filter((s) => selectedStudentIds.has(s.id))
      .forEach((s) => { updated[s.id] = fillDate; });
    setStudentDates((prev) => ({ ...prev, ...updated }));
  }

  async function handleSubmit() {
    const selected = students.filter((s) => selectedStudentIds.has(s.id));
    for (const s of selected) {
      if (!studentDates[s.id]) {
        alert(`${s.name}의 예상완료일을 입력해주세요.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          book_id: selectedBookId,
          start_date: startDate,
          note: note || null,
          students: selected.map((s) => ({
            student_id: s.id,
            expected_end_date: studentDates[s.id],
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
        return;
      }

      alert(`✅ ${selected.length}명의 읽기 기록이 생성되었습니다.`);
      router.push(`/classes/${selectedClassId}`);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedBook = books.find((b) => b.id === selectedBookId);

  // Group books by series
  const booksBySeries = books.reduce<Record<string, Book[]>>((acc, book) => {
    const key = book.series ?? '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(book);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {(['반 선택', '도서 선택', '학생 선택', '날짜 입력'] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i + 1 ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-indigo-600 text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={step === i + 1 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
              {label}
            </span>
            {i < 3 && <span className="text-gray-300">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Select class */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">반을 선택하세요</h2>
          <div className="grid grid-cols-2 gap-3">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedClassId(c.id); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedClassId === c.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <span className="font-medium">{c.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!selectedClassId}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            다음 →
          </button>
        </div>
      )}

      {/* Step 2: Select book */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">도서를 선택하세요</h2>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
          >
            <option value="">도서를 선택하세요</option>
            {Object.entries(booksBySeries).map(([series, seriesBooks]) => (
              <optgroup key={series} label={series}>
                {seriesBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}{b.volume_no ? ` (Vol.${b.volume_no})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div>
            <label className="block text-sm text-gray-600 mb-1">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              ← 이전
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedBookId}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select students */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-2">학생을 선택하세요</h2>
          <p className="text-sm text-gray-400 mb-4">
            {selectedClass?.name} · {selectedBook?.title}
          </p>
          {loading ? (
            <div className="text-gray-400 text-sm py-4">학생 목록 로딩 중...</div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSelectedStudentIds(new Set(students.map((s) => s.id)))}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  전체 선택
                </button>
                <button
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  전체 해제
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {students.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStudentIds.has(s.id)
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              ← 이전
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={selectedStudentIds.size === 0}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              다음 → ({selectedStudentIds.size}명)
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Enter expected end dates per student */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-1">예상완료일 입력</h2>
          <p className="text-sm text-gray-400 mb-4">
            {selectedClass?.name} · {selectedBook?.title} · 시작일: {startDate}
          </p>

          {/* Fill all convenience */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="text-sm text-gray-600">전체 일괄 적용:</label>
            <input
              type="date"
              value={fillDate}
              onChange={(e) => setFillDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={fillAllDates}
              disabled={!fillDate}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              전체 적용
            </button>
          </div>

          <div className="space-y-2">
            {students
              .filter((s) => selectedStudentIds.has(s.id))
              .map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{s.name}</span>
                  <input
                    type="date"
                    value={studentDates[s.id] ?? ''}
                    onChange={(e) => setStudentDates((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>
              ))}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mt-4 mb-1">메모 (선택)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="일괄 시작 메모"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              ← 이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '처리 중...' : `✅ ${selectedStudentIds.size}명 일괄 시작`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
