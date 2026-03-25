import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export const SESSION_COOKIE = 'academy_session';
const SESSION_VALUE = 'authenticated';

/**
 * Verify the submitted PIN against the stored hash in ADMIN_PIN_HASH env var.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const hash = process.env.ADMIN_PIN_HASH;
  if (!hash) {
    // If no hash configured, allow any non-empty PIN (dev only)
    return pin.length > 0;
  }
  return bcrypt.compare(pin, hash);
}

/**
 * Check whether the current request has a valid session cookie.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

/**
 * Set the session cookie (call after successful PIN verification).
 */
export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
