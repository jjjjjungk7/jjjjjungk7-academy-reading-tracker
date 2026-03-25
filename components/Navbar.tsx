'use client';

import Link from 'next/link';

export default function Navbar() {
  async function handleLogout() {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    window.location.href = '/login';
  }

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg tracking-tight hover:text-indigo-200 transition-colors">
          📚 Reading Tracker
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-indigo-200 transition-colors">홈</Link>
          <Link href="/books" className="hover:text-indigo-200 transition-colors">도서</Link>
          <Link href="/orders" className="hover:text-indigo-200 transition-colors">주문</Link>
          <Link href="/batch/start" className="hover:text-indigo-200 transition-colors">일괄시작</Link>
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1 rounded bg-indigo-500 hover:bg-indigo-400 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
