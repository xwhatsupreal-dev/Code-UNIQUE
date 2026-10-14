export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Navigation
    latestMenu: 'โค้ดล่าสุด',
    allMenu: 'โค้ดทั้งหมด',
    guideMenu: 'วิธีใส่โค้ด',
    adminMenu: 'แอดมิน',
    toggleSound: 'เสียงเอฟเฟกต์',

    // Hero Banner
    heroTag: '// OFFICIAL REDEEM HUB · SEA SERVER',
    heroTitlePrefix: 'โค้ดเกม',
    heroTitleHighlight: 'OPM The Strongest',
    heroSubtitle: 'รวบรวมโค้ดเกม ONE PUNCH MAN: The Strongest สำหรับเซิร์ฟเวอร์ SEA อัปเดตแบบเรียลไทม์ ใช้งานได้จริง',
    latestCodeTicker: 'โค้ดล่าสุด:',
    serverBadge: 'เซิร์ฟเวอร์ SEA',
    latestPill: 'โค้ดล่าสุด (ใน 7 วัน):',
    activePill: 'คาดว่ายังใช้งานได้ทั้งหมด:',
    serverPill: 'เซิร์ฟเวอร์:',
    seaOnly: 'SEA เท่านั้น',
    codesCountSuffix: 'โค้ด',

    // View 1 (Latest Codes)
    latestWorkingHeader: 'โค้ดล่าสุดที่ใช้งานได้',
    latestWorkingSub: '· โชว์ภายใน 7 วันล่าสุด',
    viewAllLink: 'ดูทั้งหมด',
    noNewCodes7Days: 'ยังไม่มีโค้ดใหม่ในช่วง 7 วันนี้',
    noNewCodes7DaysDesc: 'โค้ดที่เพิ่มมาเกิน 7 วันจะถูกนำคำว่าล่าสุดออกและแสดงที่แท็บ "โค้ดทั้งหมด" คุณสามารถค้นหาและคัดลอกโค้ดทั้งหมดได้ที่นั่น',
    viewAllCodesBtn: 'ดูโค้ดทั้งหมด',

    // View 2 (All Codes)
    allCodesHeader: 'รายการโค้ดทั้งหมด',
    allCodesSub: 'ค้นหาและคัดลอกโค้ดเกม ONE PUNCH MAN สำหรับเซิร์ฟเวอร์ SEA',
    searchPlaceholder: 'ค้นหาโค้ดที่ต้องการ...',
    clearSearch: 'ล้าง',
    tabAll: 'ทั้งหมด',
    tabActive: 'คาดว่ายังใช้งานได้',
    tabExpired: 'หมดอายุแล้ว',
    foundItems: 'พบ',
    itemsSuffix: 'รายการ (เรียงตามที่มาใหม่อัตโนมัติ)',
    copyAllOneClick: 'คัดลอกโค้ดที่คาดว่ายังใช้งานได้ทั้งหมดใน 1 คลิก',
    noCodesFound: 'ไม่พบโค้ดที่ตรงกับการค้นหา',
    noCodesInSystem: 'ยังไม่มีโค้ดในระบบ',

    // Code Card
    badgeLatest: 'ล่าสุด',
    statusWorking: 'ใช้งานได้',
    statusLikelyWorking: 'คาดว่ายังใช้งานได้',
    statusExpired: 'หมดอายุ',
    redeemed: 'แลกแล้ว',
    notRedeemed: 'ยังไม่แลก',
    markRedeemedTitle: 'บันทึกว่าแลกโค้ดนี้แล้ว',
    copyBtn: 'คัดลอก',
    copiedBtn: 'คัดลอกแล้ว',
    arrivedAt: 'มาเมื่อ:',
    expiresAt: 'วันหมดอายุ:',
    copiedToast: 'คัดลอกเรียบร้อยแล้ว!',

    // Guide Tab
    guideTag: '// STEP-BY-STEP REDEEM INSTRUCTIONS',
    guideHeader: 'วิธีใส่โค้ด OPM The Strongest',
    guideSub: 'คู่มือการแลกโค้ดของขวัญในเกมทีละขั้นตอนพร้อมภาพประกอบ',
    step1Title: 'เปิดเกมและไปที่หน้าหลัก',
    step1Desc: 'เข้าสู่เกม ONE PUNCH MAN: The Strongest (เซิร์ฟเวอร์ SEA)',
    step2Title: 'กดที่รูปโปรไฟล์ตัวละคร',
    step2Desc: 'แตะที่รูปโปรไฟล์ที่มุมบนซ้ายของหน้าจอหลักในเกม เพื่อเปิดหน้าข้อมูลผู้เล่น',
    step3Title: 'เลือกเมนู "โค้ดรางวัล"',
    step3Desc: 'กดที่ปุ่ม "โค้ดรางวัล" ในหน้าต่างข้อมูลผู้เล่น',
    step4Title: 'วางโค้ดแล้วกดยืนยัน',
    step4Desc: 'นำโค้ดที่คัดลอกจากเว็บนี้ไปวางลงในช่อง แล้วกดยืนยันเพื่อรับของรางวัล',
    guideNote: 'หมายเหตุ: โค้ดแต่ละโค้ดสามารถแลกรับของรางวัลได้ 1 ครั้งต่อ 1 บัญชีเกมเท่านั้น',

    // Batch Copy Modal
    modalTitle: 'คัดลอกโค้ดทั้งหมดในครั้งเดียว',
    modalSub: 'รวมทั้งหมด {count} โค้ดที่คาดว่ายังใช้งานได้',
    modalNote: '* คัดลอกนำไปแชร์ให้เพื่อนในกิลด์ หรือวางทีละโค้ดในเกมได้สะดวกรวดเร็ว',
    modalCopyBtn: 'คัดลอกทั้ง {count} โค้ดทันที',
    modalCopiedBtn: 'คัดลอกทั้งหมดแล้ว!',
    batchCopySuccessToast: 'คัดลอกโค้ดทั้งหมดเรียบร้อยแล้ว!',
  },
  en: {
    // Navigation
    latestMenu: 'Latest Codes',
    allMenu: 'All Codes',
    guideMenu: 'Redeem Guide',
    adminMenu: 'Admin',
    toggleSound: 'Sound FX',

    // Hero Banner
    heroTag: '// OFFICIAL REDEEM HUB · SEA SERVER',
    heroTitlePrefix: 'Redeem Codes',
    heroTitleHighlight: 'OPM The Strongest',
    heroSubtitle: 'Real-time updated redeem codes for ONE PUNCH MAN: The Strongest (SEA Server). Verified & working.',
    latestCodeTicker: 'Latest Code:',
    serverBadge: 'Server SEA',
    latestPill: 'New (Last 7 Days):',
    activePill: 'Total Likely Working:',
    serverPill: 'Server:',
    seaOnly: 'SEA Only',
    codesCountSuffix: 'codes',

    // View 1 (Latest Codes)
    latestWorkingHeader: 'Latest Working Codes',
    latestWorkingSub: '· Added within the last 7 days',
    viewAllLink: 'View All',
    noNewCodes7Days: 'No new codes in the last 7 days',
    noNewCodes7DaysDesc: 'Codes older than 7 days have their latest badge removed and are available in "All Codes". You can view and copy all working codes there.',
    viewAllCodesBtn: 'View All Codes',

    // View 2 (All Codes)
    allCodesHeader: 'All Redeem Codes',
    allCodesSub: 'Search and copy ONE PUNCH MAN codes for SEA Server',
    searchPlaceholder: 'Search codes...',
    clearSearch: 'Clear',
    tabAll: 'All',
    tabActive: 'Likely Working',
    tabExpired: 'Expired',
    foundItems: 'Found',
    itemsSuffix: 'codes (sorted by newest)',
    copyAllOneClick: 'Copy all active codes in 1 click',
    noCodesFound: 'No codes found matching your search',
    noCodesInSystem: 'No codes available in system',

    // Code Card
    badgeLatest: 'NEW',
    statusWorking: 'Working',
    statusLikelyWorking: 'Likely Working',
    statusExpired: 'Expired',
    redeemed: 'Claimed',
    notRedeemed: 'Unclaimed',
    markRedeemedTitle: 'Mark as redeemed',
    copyBtn: 'Copy',
    copiedBtn: 'Copied!',
    arrivedAt: 'Added:',
    expiresAt: 'Expires:',
    copiedToast: 'Copied successfully!',

    // Guide Tab
    guideTag: '// STEP-BY-STEP REDEEM INSTRUCTIONS',
    guideHeader: 'How to Redeem OPM The Strongest Codes',
    guideSub: 'Step-by-step game redemption guide with screenshots',
    step1Title: 'Launch the game and go to Home',
    step1Desc: 'Open ONE PUNCH MAN: The Strongest (SEA Server)',
    step2Title: 'Tap character avatar profile',
    step2Desc: 'Tap your profile avatar at the top-left corner of the main screen to open player info',
    step3Title: 'Select "Reward Code" menu',
    step3Desc: 'Tap the "Reward Code" button on your player profile window',
    step4Title: 'Paste code and confirm',
    step4Desc: 'Paste the code copied from this website into the input box, then press confirm to claim your rewards',
    guideNote: 'Note: Each code can only be redeemed once per game account.',

    // Batch Copy Modal
    modalTitle: 'Copy All Codes at Once',
    modalSub: 'Total {count} codes likely still working',
    modalNote: '* Easily copy to share with guildmates or redeem in-game.',
    modalCopyBtn: 'Copy all {count} codes',
    modalCopiedBtn: 'All copied!',
    batchCopySuccessToast: 'Copied all codes successfully!',
  },
};
