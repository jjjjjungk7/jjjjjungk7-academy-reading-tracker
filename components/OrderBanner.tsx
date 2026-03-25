import Link from 'next/link';
import { BannerItem } from '@/lib/types';

interface OrderBannerProps {
  items: BannerItem[];
}

export default function OrderBanner({ items }: OrderBannerProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-amber-100 border border-amber-400 text-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">⚠️</span>
        <span className="font-semibold text-base">
          주문 필요: {items.length}건 (예상완료 7일 이내)
        </span>
        <Link
          href="/orders"
          className="ml-auto text-sm text-amber-700 underline hover:text-amber-900"
        >
          주문 관리 →
        </Link>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 5).map((item) => (
          <li key={item.reading_record_id} className="text-sm flex items-center gap-2">
            <span className="font-medium">{item.student_name}</span>
            <span className="text-amber-600">({item.class_name})</span>
            <span>—</span>
            <span>{item.book_title}</span>
            <span className="text-amber-700 font-medium">
              {item.days_remaining <= 0
                ? '⚡ 오늘/초과'
                : `D-${item.days_remaining}`}
            </span>
          </li>
        ))}
        {items.length > 5 && (
          <li className="text-sm text-amber-600">외 {items.length - 5}건 더...</li>
        )}
      </ul>
    </div>
  );
}
