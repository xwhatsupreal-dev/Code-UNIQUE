import { RedeemCode } from '../types/code';

/**
 * 7 Days in Milliseconds
 * 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
 */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms

/**
 * Check if a code was added within the last 7 days
 * After 7 days, returns false automatically
 */
export function isCodeLatest(code: RedeemCode): boolean {
  if (!code.addedAtTimestamp) {
    return code.isNew === true && code.addedAt === 'ล่าสุด';
  }
  const now = Date.now();
  const age = now - code.addedAtTimestamp;
  return age >= 0 && age <= SEVEN_DAYS_MS;
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const ENG_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format code arrival / added date & time in Thai or English
 */
export function formatCodeTime(
  timestamp?: number,
  fallbackStr?: string,
  lang: 'th' | 'en' = 'th'
): {
  full: string;
  relative: string;
  daysRemaining?: number;
  isLatest: boolean;
} {
  if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp)) {
    const fallback = fallbackStr || (lang === 'en' ? 'Latest' : 'ล่าสุด');
    return {
      full: fallback,
      relative: fallback,
      isLatest: fallback === 'ล่าสุด' || fallback === 'Latest',
    };
  }

  const now = Date.now();
  const diffMs = now - timestamp;
  const isLatest = diffMs >= 0 && diffMs <= SEVEN_DAYS_MS;
  const daysRemaining = isLatest
    ? Math.max(1, Math.ceil((SEVEN_DAYS_MS - diffMs) / (24 * 60 * 60 * 1000)))
    : 0;

  const date = new Date(timestamp);
  const day = date.getDate();
  const monthList = lang === 'en' ? ENG_MONTHS : THAI_MONTHS;
  const month = monthList[date.getMonth()] || '';
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const full =
    lang === 'en'
      ? `${month} ${day}, ${year} at ${hours}:${minutes}`
      : `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;

  let relative = '';
  if (lang === 'en') {
    if (diffMs < 0 || diffMs < 60 * 1000) {
      relative = 'Just now';
    } else if (diffMs < 60 * 60 * 1000) {
      const mins = Math.floor(diffMs / (60 * 1000));
      relative = `${mins}m ago`;
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hrs = Math.floor(diffMs / (60 * 60 * 1000));
      relative = `${hrs}h ago`;
    } else if (diffMs <= SEVEN_DAYS_MS) {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      relative = `${days}d ago (${hours}:${minutes})`;
    } else {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      relative = `${month} ${day}, ${year} (${days}d ago)`;
    }
  } else {
    if (diffMs < 0 || diffMs < 60 * 1000) {
      relative = 'เมื่อสักครู่';
    } else if (diffMs < 60 * 60 * 1000) {
      const mins = Math.floor(diffMs / (60 * 1000));
      relative = `${mins} นาทีที่แล้ว`;
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hrs = Math.floor(diffMs / (60 * 60 * 1000));
      relative = `${hrs} ชั่วโมงที่แล้ว`;
    } else if (diffMs <= SEVEN_DAYS_MS) {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      relative = `${days} วันที่แล้ว (${hours}:${minutes} น.)`;
    } else {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      relative = `${day} ${month} ${year} (${days} วันที่แล้ว)`;
    }
  }

  return {
    full,
    relative,
    daysRemaining,
    isLatest,
  };
}
