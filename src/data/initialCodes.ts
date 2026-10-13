import { RedeemCode, ActivityEvent } from '../types/code';

// โค้ดเริ่มต้น: ซิงค์จาก Cloudflare Edge Storage (มีโค้ด ควว ที่แอดมินสร้างไว้)
export const INITIAL_CODES: RedeemCode[] = [
  {
    code: 'ควว',
    server: 'SEA',
    status: 'ACTIVE',
    rewards: [],
    description: 'โค้ดเซิร์ฟเวอร์ SEA',
    addedAt: 'ล่าสุด',
    addedAtTimestamp: 1791892131731,
    expiresAt: '???',
    verifiedWorking: true,
    workingVotes: 5,
    expiredVotes: 0,
    isNew: true,
    isHot: false,
    id: 'user-1791892131730-0-36mr',
  },
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'new_code',
    user: 'HeroAssociationBot',
    code: 'ควว',
    timestamp: 'เมื่อสักครู่',
    detail: 'โค้ดเซิร์ฟเวอร์ SEA พร้อมใช้งานแล้ว',
  },
];
