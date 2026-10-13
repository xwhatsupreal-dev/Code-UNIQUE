import { RedeemCode } from '../types/code';

/**
 * Sorts code list:
 * 1. Active codes come before Expired codes
 * 2. Within active codes: highest addedAtTimestamp / isNew first, then sourceOrder (lower index = newer)
 * This ensures any newly added code (by teerasit.thanwa@gmail.com) is always placed at the very top automatically.
 */
export function sortCodesByNewest(codes: RedeemCode[]): RedeemCode[] {
  return [...codes].sort((a, b) => {
    // 1. Active first
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;

    // 2. Newest addedAtTimestamp (latest on top)
    const timeA = a.addedAtTimestamp ?? 0;
    const timeB = b.addedAtTimestamp ?? 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    // 3. isNew flag
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;

    // 4. Source order (lower index = newer)
    const orderA = a.sourceOrder ?? 999;
    const orderB = b.sourceOrder ?? 999;
    return orderA - orderB;
  });
}
