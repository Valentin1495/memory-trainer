import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

const UUID_V4ISH_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUUID(): string {
  // crypto.randomUUID()는 HTTPS(보안 컨텍스트)에서만 동작
  // HTTP(로컬 IP) 환경을 위한 폴백
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 UUID 폴백
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUuid(value: string): boolean {
  return UUID_V4ISH_REGEX.test(value);
}

export function getGuestId(): string {
  const stored = localStorage.getItem('guestId');
  if (stored && isValidUuid(stored)) return stored;

  const newId = generateUUID();
  localStorage.setItem('guestId', newId);
  return newId;
}

export function getNickname(): string | null {
  return localStorage.getItem('nickname');
}

export function setNickname(nickname: string): void {
  localStorage.setItem('nickname', nickname);
}
