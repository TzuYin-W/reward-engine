import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Check, Clock, Sun, Moon, Plus, ChevronDown, ChevronUp, Star, 
  ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, 
  CreditCard, RefreshCw, Search, Palette, Heart, ArrowUpDown, 
  ArrowUp, ArrowDown, Trophy, Smartphone
} from 'lucide-react';

// --- 安全初始化 Firebase (相容 Vercel / LocalStorage) ---
let db = null;
let auth = null;
let appId = 'reward-engine-2026';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    if (getApps().length === 0) {
      const config = JSON.parse(__firebase_config);
      const firebaseApp = initializeApp(config);
      auth = getAuth(firebaseApp);
      db = getFirestore(firebaseApp);
    }
  }
  if (typeof __app_id !== 'undefined' && __app_id) {
    appId = String(__app_id).replace(/[^a-zA-Z0-9_-]/g, '_');
  }
} catch (e) {
  console.warn("Firebase config not found or invalid, running in offline localStorage mode.");
}

// --- 銀行架構庫 ---
const BANK_HIERARCHY = [
  { name: 'CTBC 中國信託', code: 'CTBC', cards: ['All Me 卡', 'LINE Pay 卡'] },
  { name: 'CATHAY 國泰世華', code: 'CATHAY', cards: ['CUBE 卡'] },
  { name: 'FUBON 台北富邦', code: 'FUBON', cards: ['J 卡', 'Open Possible 卡'] },
  { name: 'TAISHIN 台新銀行', code: 'TAISHIN', cards: ['@GoGo 卡', '玫瑰卡', 'Richart 卡'] },
  { name: 'E.SUN 玉山銀行', code: 'ESUN', cards: ['U Bear 卡'] },
  { name: 'SINOPAC 永豐銀行', code: 'SINOPAC', cards: ['DAWAY 卡', 'Sport 卡', '大戶 DAWHO 現金回饋卡', '現金回饋 JCB 卡'] },
  { name: 'FEDERAL 聯邦銀行', code: 'FEDERAL', cards: ['吉鶴卡'] },
  { name: 'HSBC 滙豐銀行', code: 'HSBC', cards: ['現金回饋御璽卡'] }
];

// --- 2026 年最新信用卡權益資料庫 ---
const INITIAL_CAMPAIGNS = [
  { 
    id: 'fubon_j', 
    bank: 'FUBON 台北富邦', 
    card: 'J 卡', 
    name: '日韓旅遊推薦', 
    category: '旅遊', 
    totalRate: 10, 
    baseRate: 1, 
    bonusRate: 9, 
    domesticRate: 1, 
    overseasRate: 10, 
    startDate: '2026-04-01', 
    endDate: '2026-12-31', 
    mainTag: '日韓 10%',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png', 
    gradient: 'from-rose-50 via-white to-rose-100', 
    textColor: 'text-rose-900', 
    link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [
      { label: '國內一般消費', value: '1% LINE POINTS (無上限)' }, 
      { label: '日韓實體消費', value: '3% (無上限)' }, 
      { label: '實體活動加碼', value: '+3% (需每季登錄)' }, 
      { label: '交通卡加碼', value: '+7% (需每季登錄)' }
    ],
    importantNotesList: [
      { 
        title: '活動一：日韓泰實體加碼 3%~5%', 
        highlight: '※ 日韓實體消費加碼 3%、泰國實體加碼 5%。每季需登錄一次。', 
        schedule: [
          { month: 'Q2 檔期', time: '04/20 16:00 起', limit: '限量 20,000 名' }, 
          { month: 'Q3 檔期', time: '07/20 16:00 起', limit: '限量 20,000 名' }, 
          { month: 'Q4 檔期', time: '10/20 16:00 起', limit: '限量 20,000 名' }
        ], 
        footer: '每季回饋上限 600 元。' 
      },
      { 
        title: '活動二：日本交通卡儲值 10%', 
        highlight: '※ Apple Pay 綁定 J 卡儲值 Suica/PASMO/ICOCA 享最高 10%。', 
        schedule: [
          { month: '每月開放', time: '每月 18 號 16:00', limit: '限量 10,000 名' }
        ], 
        footer: '單筆需滿 2,000 日圓，每季回饋上限 200 元。' 
      }
    ],
    channels: [
      { title: '🚅 日本交通卡 (10%)', content: 'Apple Pay 綁定儲值 Suica、PASMO、ICOCA，最高享 10% 回饋。', rate: '10%' },
      { title: '🇯🇵 日本實體消費 (6%)', content: '日本當地實體店家、免稅店、唐吉訶德、BicCamera 等實體過卡享 6%。', rate: '6%' },
      { title: '🇰🇷 韓國指定通路 (10%)', content: '韓國當地指定免稅店與連鎖門市透過 LINE Pay 條碼支付加碼享最高 10%。', rate: '10%' }
    ]
  },
  { 
    id: 'ctbc_linepay', 
    bank: 'CTBC 中國信託', 
    card: 'LINE Pay 卡', 
    name: 'LINE POINTS 生態圈', 
    category: '一般消費', 
    totalRate: 16, 
    baseRate: 1, 
    bonusRate: 15, 
    domesticRate: 1, 
    overseasRate: 5, 
    startDate: '2026-07-01', 
    endDate: '2026-12-31', 
    mainTag: '點數回饋',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/images/card_01.png', 
    gradient: 'from-green-500 to-emerald-700', 
    textColor: 'text-white', 
    link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html',
    details: [
      { label: '國內一般消費', value: '1% LINE POINTS (無上限)' }, 
      { label: '國外實體消費', value: '2.8% (無上限)' }, 
      { label: '指定通路加碼', value: '最高 16% (需登錄/優惠碼)' }
    ],
    importantNotesList: [
      { 
        title: 'Hotels.com 訂房最高 16%', 
        highlight: '※ 需使用專屬連結並輸入優惠碼「CTBCLP16」，且以 LINE Pay 卡全額支付。', 
        schedule: [{ month: '每月檔期', time: '每月 1 號開放', limit: '每月限量 400 組' }], 
        footer: '單筆回饋上限 1,800 點。' 
      },
      { 
        title: '海外實體門市 5% 加碼', 
        highlight: '※ 日本、韓國、泰國、美國實體商店消費享 5%（含原權益 2.8% + 加碼 2.2%）。', 
        schedule: [{ month: '下半年度', time: '每季需登錄', limit: '每季每戶上限 450 點' }], 
        footer: '限實體過卡交易，不含網路線上交易。' 
      }
    ],
    channels: [
      { title: '🏨 Hotels.com (16%)', content: '全球指定飯店訂房並輸入指定折扣代碼，享最高 16% LINE POINTS。', rate: '16%' },
      { title: '🛍️ 日系時尚 (10%)', content: '【JCB 卡限定】Uniqlo、GU 實體門市單筆滿 2,000 元享 10%（需登錄）。', rate: '10%' },
      { title: '🍣 連鎖美饌 (10%)', content: '【JCB 卡限定】壽司郎、藏壽司、摩斯漢堡實體刷卡享 10%（需登錄）。', rate: '10%' },
      { title: '🌏 美日韓泰實體 (5%)', content: '美日韓泰實體商店消費加碼 2.2%，合計 5% 回饋。', rate: '5%' }
    ]
  },
  { 
    id: 'cathay_cube', 
    bank: 'CATHAY 國泰世華', 
    card: 'CUBE 卡', 
    name: '多重權益自由切換', 
    category: '旅遊', 
    totalRate: 10, 
    baseRate: 0.3, 
    bonusRate: 9.7, 
    domesticRate: 3.3, 
    overseasRate: 3.3, 
    startDate: '2026-01-01', 
    endDate: '2026-12-31', 
    mainTag: '權益自選',
    image: 'https://www.cathaybk.com.tw/cathaybk/-/media/C1ce1986-7786-4f24-862a-350734057863.png', 
    gradient: 'from-gray-200 to-gray-400', 
    textColor: 'text-gray-800', 
    link: 'https://www.cathaybk.com.tw/cathaybk/personal/product/credit-card/cards/cube/',
    details: [
      { label: '一般消費', value: '0.3% 小樹點 (無上限)' }, 
      { label: '指定方案權益', value: '3%~3.3% 小樹點 (無上限)' }, 
      { label: '慶生月加碼', value: '最高 10% 小樹點' }
    ],
    importantNotesList: [
      { 
        title: '每日切換權益方案規則', 
        highlight: '※ 每日可透過國泰世華 CUBE App 切換一次權益方案，當日全天消費以最終切換方案計算。', 
        schedule: [{ month: '每日維護', time: '每日 23:59 前切換', limit: '每日一次' }], 
        footer: '切換成功即刻生效於當日 00:00 起之所有交易。' 
      }
    ],
    channels: [
      { title: '🛍️ 玩數位 (3.3%)', content: '蝦皮購物、momo購物網、PChome 24h、淘寶、Netflix、Spotify、App Store。', rate: '3.3%' },
      { title: '🍽️ 樂饗購 (3.3%)', content: 'Uber Eats、foodpanda、全台連鎖餐廳、SOGO、新光三越、遠東百貨。', rate: '3.3%' },
      { title: '✈️ 趣旅行 (3.3%)', content: '高鐵、Uber、各大航空公司、Agoda、Booking.com、Klook、KKday。', rate: '3.3%' },
      { title: '🇯🇵 日本賞 (3.5%)', content: '日本實體消費、JR東日本、唐吉訶德、BicCamera、松本清。', rate: '3.5%' }
    ]
  },
  { 
    id: 'taishin_rose', 
    bank: 'TAISHIN 台新銀行', 
    card: '玫瑰卡', 
    name: '權益天天切換', 
    category: '一般消費', 
    totalRate: 3.8, 
    baseRate: 0.3, 
    bonusRate: 3.5, 
    domesticRate: 3.8, 
    overseasRate: 3.8, 
    startDate: '2026-07-01', 
    endDate: '2027-03-31', 
    mainTag: '切換 3.8%',
    image: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010102/TS020101010202/images/card_02.png', 
    gradient: 'from-rose-400 via-rose-300 to-pink-200', 
    textColor: 'text-rose-900', 
    link: 'https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/cg013/card0001/',
    details: [
      { label: '一般消費', value: '0.3% 台新 Point' }, 
      { label: '指定權益切換', value: '3.8% 台新 Point (無上限)' }, 
      { label: '海外實體', value: '3.8% (日韓歐美免切換)' }
    ],
    channels: [
      { title: '🔄 權益切換 (3.8%)', content: '每日可於 Richart Life App 切換：「天天刷」、「大筆刷」、「好饗刷」、「Pay著刷」。', rate: '3.8%' },
      { title: '🏪 天天刷 (3.8%)', content: '全家、7-11、家樂福、中油直營、全國加油站、Uber、台灣大車隊。', rate: '3.8%' },
      { title: '🛍️ 大筆刷 (3.8%)', content: '新光三越、SOGO、遠東百貨、momo、蝦皮購物、PChome、淘寶。', rate: '3.8%' },
      { title: '🍽️ 好饗刷 (3.8%)', content: '全台實體餐廳、Uber Eats、foodpanda、星巴克、路易莎、錢櫃。', rate: '3.8%' }
    ]
  },
  { 
    id: 'sinopac_daway', 
    bank: 'SINOPAC 永豐銀行', 
    card: 'DAWAY 卡', 
    name: 'LINE Pay 特選神卡', 
    category: '生活', 
    totalRate: 6, 
    baseRate: 0.5, 
    bonusRate: 5.5, 
    domesticRate: 6, 
    overseasRate: 6, 
    startDate: '2026-07-01', 
    endDate: '2026-12-31', 
    mainTag: 'LINE Pay 6%',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/DAWAY_Card.png', 
    gradient: 'from-lime-400 to-green-600', 
    textColor: 'text-black', 
    link: 'https://bank.sinopac.com/sinopacbt/personal/credit-card/introduction/bankcard/DAWAY.html',
    details: [
      { label: '國內外一般消費', value: '0.5% LINE POINTS (無上限)' }, 
      { label: 'LINE Pay 加碼', value: '+1.5% (綁定大戶扣繳無上限)' }, 
      { label: '新戶首年加碼', value: '+4% (月上限 300 點)' }
    ],
    importantNotesList: [
      { 
        title: '新戶專屬 LINE Pay 6%', 
        highlight: '※ 新戶申辦並設定永豐帳戶自動扣繳信用卡費，綁定 LINE Pay 享 6%（月上限 300 點）。', 
        schedule: [{ month: '常態檔期', time: '核卡日起 12 個月內', limit: '新戶專屬' }], 
        footer: '舊戶綁定 LINE Pay 亦享 2% 回饋無上限。' 
      }
    ],
    channels: [
      { title: '📱 LINE Pay 全通路 (6%)', content: '全台支援 LINE Pay 之實體門市與線上購物（超商、量販、外送、夜市等）。', rate: '6%' },
      { title: '🥤 連鎖手搖飲 (10%)', content: '50嵐、清心福全、可不可、麻古茶坊使用 LINE Pay 綁定消費享指定加碼。', rate: '10%' }
    ]
  },
  { 
    id: 'hsbc_cashback', 
    bank: 'HSBC 滙豐銀行', 
    card: '現金回饋御璽卡', 
    name: '無腦刷首選', 
    category: '一般消費', 
    totalRate: 2.22, 
    baseRate: 1.22, 
    bonusRate: 1, 
    domesticRate: 1.22, 
    overseasRate: 2.22, 
    startDate: '2026-01-01', 
    endDate: '2026-12-31', 
    mainTag: '無腦刷',
    image: 'https://www.hsbc.com.tw/content/dam/hsbc/tw/images/credit-cards/hsbc-cash-back-card-490x306.png', 
    gradient: 'from-red-600 to-red-800', 
    textColor: 'text-white', 
    link: 'https://www.hsbc.com.tw/credit-cards/products/cashback-signature/',
    details: [
      { label: '國內消費', value: '1.22% 現金回饋 (無上限)' }, 
      { label: '國外消費', value: '2.22% 現金回饋 (無上限)' }, 
      { label: '保費回饋', value: '1.22% 現金回饋 (無上限)' }
    ],
    importantNotesList: [
      { 
        title: '現金積點終身有效', 
        highlight: '※ 回饋金自動折抵次期帳單，無消費門檻，終身不歸零。', 
        schedule: [{ month: '年度常態', time: '帳單週期自動折抵', limit: '無上限' }], 
        footer: '海外消費不含歐盟與英國實體門市。' 
      }
    ],
    channels: [
      { title: '🇹🇼 國內無腦刷 (1.22%)', content: '國內一般實體與線上消費、水電瓦斯、保險費享 1.22% 無上限。', rate: '1.22%' },
      { title: '✈️ 海外無腦刷 (2.22%)', content: '全球海外消費（非歐盟實體）享 2.22% 現金回饋無上限。', rate: '2.22%' }
    ]
  },
  { 
    id: 'sinopac_dawho', 
    bank: 'SINOPAC 永豐銀行', 
    card: '大戶 DAWHO 現金回饋卡', 
    name: '大戶七大生活通路', 
    category: '旅遊', 
    totalRate: 8, 
    baseRate: 1, 
    bonusRate: 7, 
    domesticRate: 7, 
    overseasRate: 8, 
    startDate: '2026-07-01', 
    endDate: '2026-12-31', 
    mainTag: '大戶專屬',
    image: 'https://dawho.tw/assets/images/card/credit-card-black.png', 
    gradient: 'from-neutral-900 via-black to-neutral-800', 
    textColor: 'text-yellow-500', 
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html',
    details: [
      { label: '國內一般消費', value: '1% 現金回饋' }, 
      { label: '國外一般消費', value: '2% 現金回饋' }, 
      { label: '大戶任務加碼', value: '+1% (綁定大戶自動扣繳)' }, 
      { label: '七大通路加碼', value: '+5% (月上限 300 元)' }
    ],
    channels: [
      { title: '✈️ 【行】旅遊交通 (7%~8%)', content: '航空公司、飯店住宿、旅行社、免稅店、Uber、高鐵、台鐵。', rate: '8%' },
      { title: '🎬 【樂】娛樂影音 (7%)', content: '全台影城、Netflix、Spotify、Disney+、KKBOX、兩廳院售票。', rate: '7%' },
      { title: '🍽️ 【食】美饌佳餚 (7%)', content: 'Uber Eats、foodpanda、全台實體餐廳刷卡消費。', rate: '7%' }
    ]
  },
  { 
    id: 'esun_ubear', 
    bank: 'E.SUN 玉山銀行', 
    card: 'U Bear 卡', 
    name: '網購與影音娛樂首選', 
    category: '網購', 
    totalRate: 13, 
    baseRate: 1, 
    bonusRate: 12, 
    domesticRate: 3, 
    overseasRate: 3, 
    startDate: '2026-03-01', 
    endDate: '2027-02-28', 
    mainTag: '網購 3%',
    image: 'https://www.esunbank.com.tw/bank/images/esunbank/credit_card/ubear_card.png', 
    gradient: 'from-zinc-900 via-black to-zinc-900', 
    textColor: 'text-yellow-400', 
    link: 'https://event.esunbank.com.tw/credit/ubear/index.html',
    details: [
      { label: '一般消費', value: '1% 現金回饋 (無上限)' }, 
      { label: '指定網路消費', value: '3% (含行動支付，月上限 200 元)' }, 
      { label: '指定影音娛樂', value: '13% (月上限 100 元)' }
    ],
    channels: [
      { title: '🛒 指定網購 (3%)', content: '國內外網購、LINE Pay、街口支付、OPEN錢包、悠遊付、高鐵台鐵 App。', rate: '3%' },
      { title: '🎬 影音平台 (13%)', content: 'Disney+、Netflix、Spotify、Nintendo、PlayStation。', rate: '13%' }
    ]
  },
  { 
    id: 'federal_jihe', 
    bank: 'FEDERAL 聯邦銀行', 
    card: '吉鶴卡', 
    name: '日本消費首選神卡', 
    category: '旅遊', 
    totalRate: 4, 
    baseRate: 1, 
    bonusRate: 3, 
    domesticRate: 1, 
    overseasRate: 4, 
    startDate: '2026-07-01', 
    endDate: '2026-12-31', 
    mainTag: '日本 4%',
    image: 'https://card.ubot.com.tw/eCard/assets/images/creditcard/JIHO/card_01.png', 
    gradient: 'from-red-600 to-rose-700', 
    textColor: 'text-white', 
    link: 'https://card.ubot.com.tw/eCard/activity/2025JIHO/index.htm',
    details: [
      { label: '國內一般消費', value: '1% (無上限)' }, 
      { label: '日幣消費', value: '2.5% (無上限)' }, 
      { label: '日本 Apple Pay QUICPay', value: '+1.5% (合計 4% 回饋)' }
    ],
    channels: [
      { title: '🇯🇵 日本 QUICPay (4%)', content: '日本當地使用 Apple Pay 綁定吉鶴卡以 QUICPay 感應支付享 4% 回饋。', rate: '4%' },
      { title: '🛍️ 日系名店 (4%~8%)', content: 'UNIQLO、唐吉訶德、大創、松本清、日藥本舖享額外加碼。', rate: '8%' }
    ]
  }
];

const ALL_CATEGORIES = [...new Set(INITIAL_CAMPAIGNS.map(c => c.category))];
const ALL_CARDS = BANK_HIERARCHY.flatMap(b => b.cards);

// --- 擬態卡面組件 ---
const CardVisual = ({ image, gradient, textColor, cardName, bankName, uiStyle }) => {
  const [imageError, setImageError] = useState(false);
  const cardSize = "w-36 h-[91px] md:w-44 md:h-[111px]";
  
  return (
    <div className={`relative ${cardSize} perspective-1000 flex-shrink-0 group-hover:z-20 mt-1 self-end md:self-auto ${uiStyle === 'korean' ? 'perspective-none' : ''}`}>
      {!imageError && image ? (
        <img 
          src={image} 
          alt={cardName} 
          className={`w-full h-full object-cover shadow-lg transition-all duration-300 ease-out ${uiStyle === 'korean' ? 'rounded-3xl scale-95' : 'rounded-xl transform rotate-6 group-active:rotate-0'}`} 
          onError={() => setImageError(true)} 
        />
      ) : (
        <div className={`w-full h-full shadow-md rounded-xl transform rotate-6 transition-all duration-300 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10 group-active:rotate-0`}>
          <div className={`text-[9px] uppercase opacity-80 italic ${textColor} font-serif truncate`}>{bankName.split(' ')[0]}</div>
          <div className="flex justify-between items-end">
            <div className={`text-[11px] font-bold italic ${textColor} font-serif mt-0.5 truncate`}>{cardName}</div>
            <CreditCard size={14} className={`opacity-50 ${textColor}`} />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('reward_prefs_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      registeredIds: [],
      isDarkMode: true,
      uiStyle: 'nyc',
      selectedCards: ALL_CARDS,
      selectedCategories: ALL_CATEGORIES,
      cardOrder: INITIAL_CAMPAIGNS.map(c => c.id)
    };
  });

  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const lastUpdated = "2026/08/28";

  // --- Auth 初始化 ---
  useEffect(() => {
    if (!auth) {
      setIsReady(true);
      return;
    }
    const startAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setIsReady(true);
      }
    };
    startAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsReady(true);
    });
    return unsub;
  }, []);

  // --- 雲端同步監聽 ---
  useEffect(() => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data();
          const allIds = INITIAL_CAMPAIGNS.map(c => c.id);
          const cloudOrder = cloudData.cardOrder || [];
          const validOrder = cloudOrder.filter(id => allIds.includes(id));
          const newIds = allIds.filter(id => !validOrder.includes(id));
          
          setPrefs(prev => {
            const merged = { ...prev, ...cloudData, cardOrder: [...validOrder, ...newIds] };
            try { localStorage.setItem('reward_prefs_2026', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }, () => {});
      return () => unsubscribe();
    } catch (e) {}
  }, [user]);

  // --- 本地與雲端儲存 ---
  const savePreferences = async (newData) => {
    try {
      localStorage.setItem('reward_prefs_2026', JSON.stringify(newData));
    } catch (e) {}

    if (user && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
        await setDoc(docRef, newData, { merge: true });
      } catch (err) {}
    }
  };

  const updatePrefs = (updates) => {
    const nextPrefs = { ...prefs, ...updates };
    setPrefs(nextPrefs);
    savePreferences(nextPrefs);
  };

  // --- 篩選與排序邏輯 ---
  const filteredCampaigns = useMemo(() => {
    const filtered = INITIAL_CAMPAIGNS.filter(c => {
      if (!prefs.selectedCards.includes(c.card)) return false;
      if (!prefs.selectedCategories.includes(c.category)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.card.toLowerCase().includes(q) || c.bank.toLowerCase().includes(q) || c.channels.some(ch => ch.title.toLowerCase().includes(q));
      }
      return true;
    });
    return filtered.sort((a,b) => {
      const idxA = prefs.cardOrder.indexOf(a.id);
      const idxB = prefs.cardOrder.indexOf(b.id);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [prefs, searchQuery]);

  const theme = useMemo(() => {
    if (prefs.uiStyle === 'nyc') {
      return { 
        bg: prefs.isDarkMode ? 'bg-[#09090b]' : 'bg-[#f0f0f0]', 
        text: prefs.isDarkMode ? 'text-white' : 'text-black', 
        subText: 'text-neutral-500', 
        cardBg: prefs.isDarkMode ? 'bg-[#141414]' : 'bg-white', 
        accent: 'text-[#D4AF37]', 
        accentBg: 'bg-[#D4AF37]', 
        font: "font-serif", 
        rounded: 'rounded-none', 
        btn: 'rounded-full' 
      };
    } else {
      return { 
        bg: prefs.isDarkMode ? 'bg-[#2D2D3A]' : 'bg-[#FDFBF7]', 
        text: prefs.isDarkMode ? 'text-slate-100' : 'text-slate-700', 
        subText: 'text-slate-400', 
        cardBg: prefs.isDarkMode ? 'bg-[#3A3A4A]' : 'bg-white', 
        accent: prefs.isDarkMode ? 'text-violet-400' : 'text-rose-400', 
        accentBg: prefs.isDarkMode ? 'bg-violet-400' : 'bg-rose-300', 
        font: "font-sans", 
        rounded: 'rounded-3xl', 
        btn: 'rounded-2xl' 
      };
    }
  }, [prefs]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="animate-spin text-amber-500" size={28} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} ${theme.text} font-sans flex justify-center overflow-x-hidden touch-pan-y`}>
      <div className={`w-full max-w-md ${theme.bg} min-h-screen flex flex-col shadow-2xl relative overscroll-x-none`}>
      
      {/* 排序彈窗 */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-sm max-h-[70vh] flex flex-col ${theme.rounded} shadow-2xl bg-zinc-900 border border-white/10 p-4`}>
                <div className="flex justify-between items-center mb-4 text-white">
                  <h3 className="font-bold text-base">自訂卡片排序</h3>
                  <button onClick={() => setIsReorderOpen(false)}><X size={20} className="text-white"/></button>
                </div>
                <div className="overflow-y-auto space-y-2">
                    {INITIAL_CAMPAIGNS.slice().sort((a,b) => {
                      const idxA = prefs.cardOrder.indexOf(a.id);
                      const idxB = prefs.cardOrder.indexOf(b.id);
                      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                    }).map((card, idx, arr) => (
                        <div key={card.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-white">
                            <span className="text-sm font-medium">{card.card}</span>
                            <div className="flex gap-2 text-white">
                                <button 
                                  onClick={() => {
                                    const next = [...prefs.cardOrder];
                                    if (idx > 0) [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
                                    updatePrefs({ cardOrder: next });
                                  }} 
                                  disabled={idx === 0} 
                                  className={`p-1 ${idx === 0 ? 'opacity-20' : 'hover:bg-white/10 rounded'}`}
                                >
                                  <ArrowUp size={18}/>
                                </button>
                                <button 
                                  onClick={() => {
                                    const next = [...prefs.cardOrder];
                                    if (idx < arr.length-1) [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
                                    updatePrefs({ cardOrder: next });
                                  }} 
                                  disabled={idx === arr.length-1} 
                                  className={`p-1 ${idx === arr.length-1 ? 'opacity-20' : 'hover:bg-white/10 rounded'}`}
                                >
                                  <ArrowDown size={18}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      )}

      {/* 篩選彈窗 */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm flex flex-col ${theme.rounded} bg-zinc-900 border border-white/10 p-6`}>
              <div className="flex justify-between items-center mb-6 text-white font-bold text-lg">
                <h3>權益類別篩選</h3>
                <button onClick={() => setIsFilterOpen(false)}><X size={20} className="text-white"/></button>
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {ALL_CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => {
                      const next = prefs.selectedCategories.includes(cat) 
                        ? prefs.selectedCategories.filter(c => c !== cat) 
                        : [...prefs.selectedCategories, cat];
                      updatePrefs({ selectedCategories: next });
                    }} 
                    className={`px-4 py-2 text-xs border rounded-full transition-all ${prefs.selectedCategories.includes(cat) ? 'bg-amber-500 text-black border-transparent font-bold' : 'bg-transparent border-white/20 text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)} 
                className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl text-sm uppercase tracking-wider"
              >
                確認套用
              </button>
          </div>
        </div>
      )}

      {/* 頂部標頭 */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-black/5 p-4 ${theme.bg}`}>
        <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className={`text-3xl font-black tracking-tighter uppercase leading-[0.85] ${theme.font}`}>
                Reward
                <span className={`block text-2xl mt-1 ${theme.accent}`}>Engine.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[8px] opacity-40 uppercase tracking-widest font-mono">Updated</span>
                  <span className={`text-[8px] font-mono font-bold ${theme.accent}`}>{lastUpdated}</span>
                </div>
                <button 
                  onClick={() => updatePrefs({ uiStyle: prefs.uiStyle === 'nyc' ? 'korean' : 'nyc' })} 
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10 shadow-sm"
                  title="切換風格"
                >
                  {prefs.uiStyle === 'nyc' ? <Palette size={14}/> : <Heart size={14} fill="currentColor" className={theme.accent}/>}
                </button>
                <button 
                  onClick={() => updatePrefs({ isDarkMode: !prefs.isDarkMode })} 
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10 shadow-sm"
                  title="深淺模式"
                >
                  {prefs.isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                </button>
            </div>
        </div>
        <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 opacity-30" size={16}/>
            <input 
              type="text" 
              placeholder="搜尋通路或卡片 (如 Uber, 全聯...)" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className={`w-full pl-10 pr-4 py-2 text-sm bg-transparent border border-black/10 ${theme.btn} focus:outline-none focus:border-amber-500 transition-colors`} 
            />
        </div>
        <div className="flex items-center justify-between border-t border-black/5 pt-3">
           <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
              <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? theme.accent : 'opacity-40'}>Index</button>
              <button onClick={() => setViewMode('compare')} className={viewMode === 'compare' ? theme.accent : 'opacity-40'}>Rankings</button>
           </div>
           <div className="flex gap-2 items-center">
               <button onClick={() => setIsReorderOpen(true)} className="p-1 opacity-40 hover:opacity-100" title="卡片排序">
                 <ArrowUpDown size={15}/>
               </button>
               <button onClick={() => setIsFilterOpen(true)} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-black/5 rounded-md">
                 篩選
               </button>
           </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="w-full px-4 py-6 flex-1">
        {viewMode === 'list' ? (
          <div className="grid gap-6">
            {filteredCampaigns.map((c) => {
              const isReg = prefs.registeredIds.includes(c.id);
              const isExp = expandedId === c.id;
              return (
                <article key={c.id} onClick={() => setExpandedId(isExp ? null : c.id)} className="group relative cursor-pointer">
                  {isReg && (
                    <div className={`absolute right-0 -top-3 ${theme.accentBg} text-white text-[9px] font-bold px-2.5 py-0.5 z-10 ${theme.btn} shadow-lg flex items-center gap-1`}>
                      <Check size={10} strokeWidth={3}/> 已登錄
                    </div>
                  )}
                  <div className={`relative ${theme.uiStyle === 'nyc' ? 'border-t-2 border-black/10 pt-4' : `p-5 ${theme.cardBg} ${theme.rounded} shadow-xl shadow-black/5`}`}>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-start">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = isReg ? prefs.registeredIds.filter(i => i !== c.id) : [...prefs.registeredIds, c.id];
                                updatePrefs({ registeredIds: next });
                              }} 
                              className={`w-9 h-9 flex-shrink-0 border transition-all flex items-center justify-center ${theme.btn} ${isReg ? `${theme.accentBg} border-transparent text-white` : 'border-black/10 hover:border-amber-500'}`}
                            >
                              {isReg && <Check size={18} strokeWidth={3}/>}
                            </button>
                            <CardVisual image={c.image} gradient={c.gradient} textColor={c.textColor} cardName={c.card} bankName={c.bank} uiStyle={prefs.uiStyle} />
                            <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
                                <div className="space-y-0.5">
                                  <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.accent}`}>{c.bank}</div>
                                  <div className={`text-lg leading-tight font-bold ${theme.font} break-words`}>{c.card}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[9px] font-bold opacity-60">
                                  <span className={`border border-black/10 px-1.5 py-0.5 ${theme.btn}`}>{c.mainTag}</span>
                                  <span className="flex items-center gap-1"><Clock size={10}/> {c.startDate}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-baseline gap-2 border-t border-dashed border-black/5 pt-2">
                          <span className="text-[9px] opacity-40 tracking-widest uppercase">Max Reward</span>
                          <div className="text-4xl font-black">{c.totalRate}%</div>
                        </div>
                    </div>

                    {/* 展開詳情 */}
                    {isExp && (
                      <div className="mt-4 pt-4 border-t border-dashed border-black/5 space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold mb-2 opacity-40 uppercase tracking-widest">回饋架構</h4>
                          <ul className="space-y-1.5">
                              {c.details.map((d, i) => (
                                <li key={i} className="flex justify-between text-xs font-mono">
                                  <span className="opacity-70">{d.label}</span>
                                  <b>{d.value}</b>
                                </li>
                              ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold mb-2 opacity-40 uppercase tracking-widest">適用通路</h4>
                          <div className="grid gap-2">
                              {c.channels.map((ch, i) => (
                                  <div key={i} className="p-3 bg-black/5 rounded-xl">
                                    <div className="flex justify-between font-bold text-xs mb-1">
                                      <span>{ch.title}</span>
                                      <span className={theme.accent}>{ch.rate}</span>
                                    </div>
                                    <p className="text-[11px] opacity-60 leading-relaxed">{ch.content}</p>
                                  </div>
                              ))}
                          </div>
                        </div>

                        {c.importantNotesList && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold opacity-40 uppercase tracking-widest">登錄與注意事項</h4>
                            {c.importantNotesList.map((n, i) => (
                                <div key={i} className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-xl text-[11px]">
                                  <div className="font-bold flex items-center gap-1 mb-1 text-amber-600">
                                    <AlertTriangle size={12}/> {n.title}
                                  </div>
                                  <p className="opacity-80 leading-relaxed">{n.highlight}</p>
                                  {n.footer && <p className="text-[10px] opacity-50 mt-1">{n.footer}</p>}
                                </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-10">
            {['🇹🇼 國內回饋排名', '✈️ 海外回饋排名'].map(title => {
                const isDom = title.includes('國內');
                const winner = [...INITIAL_CAMPAIGNS].sort((a,b) => isDom ? b.domesticRate - a.domesticRate : b.overseasRate - a.overseasRate)[0];
                return (
                    <div key={title} className="text-center p-8 bg-black/5 rounded-[2rem] border border-black/5 shadow-xl">
                        <div className="text-[10px] font-bold opacity-40 tracking-[0.3em] mb-2 uppercase">
                          {isDom ? 'Domestic Winner' : 'Overseas Winner'}
                        </div>
                        <h3 className={`text-2xl font-black mb-3 ${theme.font}`}>{title}</h3>
                        <div className="text-6xl font-serif italic mb-6 text-transparent bg-clip-text bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600">
                          {isDom ? winner.domesticRate : winner.overseasRate}%
                        </div>
                        <div className="mb-6">
                          <div className="font-bold text-lg">{winner.card}</div>
                          <div className="text-xs opacity-50">{winner.bank}</div>
                        </div>
                        <div className="flex justify-center scale-110">
                          <CardVisual image={winner.image} gradient={winner.gradient} textColor={winner.textColor} cardName={winner.card} bankName={winner.bank} uiStyle={prefs.uiStyle} />
                        </div>
                    </div>
                );
            })}
          </div>
        )}
      </main>

      {/* 頁尾 */}
      <footer className="py-12 border-t border-black/5 text-center opacity-40">
        <h2 className="text-xs font-black italic tracking-tighter mb-3 opacity-60">REWARD ENGINE</h2>
        <div className="text-[9px] font-mono leading-relaxed uppercase tracking-[0.2em]">
          &copy; 2026 DESIGNED BY<br/>
          <span className="text-[11px] font-bold text-black dark:text-white tracking-widest mt-1 block">TZU YIN WANG (SARAH)</span>
          ALL RIGHTS RESERVED.
        </div>
      </footer>
      </div>
    </div>
  );
}
