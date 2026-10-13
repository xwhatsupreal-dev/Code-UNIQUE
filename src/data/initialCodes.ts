import { RedeemCode, ActivityEvent } from '../types/code';

// โค้ดเริ่มต้น: ลบออกทั้งหมดตามคำขอของผู้ใช้ ("ลบโค้ดที่เพิ่มมาทั้งหมดออก เดะเข้าไปเพิ่มให้เอง")
export const INITIAL_CODES: RedeemCode[] = [];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'new_code',
    user: 'HeroAssociationBot',
    code: 'ระบบพร้อมใช้งาน',
    timestamp: 'เมื่อสักครู่',
    detail: 'พร้อมให้คุณเพิ่มโค้ดเกมเซิร์ฟเวอร์ SEA ด้วยตนเอง',
  },
];
