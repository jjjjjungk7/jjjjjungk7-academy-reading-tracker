export type GoogleStudentRow = {
  name: string;
  class: string;
};

export type GoogleReadingLogRow = {
  class: string;
  student: string;
  book: string;
  titile?: string; // 시트 오타 그대로
  title?: string;  // 내부 편의
  date: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = (cols[i] ?? '').trim();
    }
    rows.push(row);
  }

  return { headers, rows };
}

async function fetchCsv(url: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return parseCsv(text);
}

export async function fetchGoogleStudents(): Promise<GoogleStudentRow[]> {
  const url = process.env.NEXT_PUBLIC_GOOGLE_STUDENTS_CSV_URL;
  if (!url) return [];

  const { rows } = await fetchCsv(url);

  return rows
    .map((r) => ({
      name: r.name ?? '',
      class: r.class ?? '',
    }))
    .filter((r) => r.name && r.class);
}

export async function fetchGoogleReadingLogs(): Promise<GoogleReadingLogRow[]> {
  const url = process.env.NEXT_PUBLIC_GOOGLE_READING_LOGS_CSV_URL;
  if (!url) return [];

  const { rows } = await fetchCsv(url);

  return rows
    .map((r) => {
      const titile = r.titile ?? '';
      return {
        class: r.class ?? '',
        student: r.student ?? '',
        book: r.book ?? '',
        titile,
        title: titile,
        date: r.date ?? '',
      };
    })
    .filter((r) => r.class && r.student);
}

export function groupLogsByStudentInClass(logs: GoogleReadingLogRow[], classId: string) {
  const inClass = logs.filter((l) => l.class === classId);
  const map = new Map<string, GoogleReadingLogRow[]>();

  for (const l of inClass) {
    map.set(l.student, [...(map.get(l.student) ?? []), l]);
  }

  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
    map.set(k, arr);
  }

  return map;
}
