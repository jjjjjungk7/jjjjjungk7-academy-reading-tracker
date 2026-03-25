import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, setSessionCookie, clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pin, action } = body;

  if (action === 'logout') {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 });
  }

  const valid = await verifyPin(pin);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
