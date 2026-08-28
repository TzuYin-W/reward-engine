import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Check, Clock, Sun, Moon, Plus, ChevronDown, ChevronUp, Star, 
  ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, 
  CreditCard, RefreshCw, Search, Palette, Heart, ArrowUpDown, 
  ArrowUp, ArrowDown, Trophy, MapPin, Cloud, Smartphone
} from 'lucide-react';

let db = null;
let auth = null;
let appId = typeof __app_id !== 'undefined' ? __app_id : 'reward-engine-pro';

const initFirebase = () => {
  try {
    if (getApps().length === 0) {
      const config = JSON.parse(__firebase_config);
      const app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (e) {
    console.warn("Firebase connection disabled - entering local fallback mode.");
  }
};
initFirebase();

const BANK_HIERARCHY = [
  { name: 'CTBC 中國信託', code: 'CTBC', cards: ['LINE Pay 卡', 'All Me 卡'] },
  { name: 'FUBON 台北富邦', code: 'FUBON', cards: ['J 卡', 'Open Possible 卡'] },
  { name: 'SINOPAC 永豐銀行', code: 'SINOPAC', cards: ['DAWAY 卡', '大戶 DAWHO 卡', 'Sport 卡', '現金回饋 JCB 卡'] },
  { name: 'HSBC 滙豐銀行', code: 'HSBC', cards: ['現金回饋御璽卡', 'Live+ 現金回饋卡'] },
  { name: 'TAISHIN 台新銀行', code: 'TAISHIN', cards: ['@GoGo 卡', '玫瑰卡', 'Richart 卡'] },
  { name: 'E.SUN 玉山銀行', code: 'ESUN', cards: ['U Bear 卡'] },
  { name: 'FEDERAL 聯邦銀行', code: 'FEDERAL', cards: ['吉鶴卡', 'LINE Bank 聯名卡'] },
  { name: 'CATHAY 國泰世華', code: 'CATHAY', cards: ['CUBE 卡'] }
];

// --- 2025/2026 最新信用卡權益資料庫 ---
const INITIAL_CAMPAIGNS = [
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
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: '點數最高16%',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/images/card_01.png',
    gradient: 'from-emerald-500 to-green-700',
    textColor: 'text-white',
    link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html',
    details: [
      { label: '國內一般消費', value: '1% LINE POINTS (無上限)' },
      { label: '國外實體消費', value: '2.8% (無上限)' },
      { label: '國外實體加碼', value: '最高 5% (需登錄，季上限450點)' },
      { label: 'Hotels.com訂房', value: '最高 16% (輸入代碼 CTBCLP16)' }
    ],
    importantNotesList: [
      {
        title: 'Hotels.com 16% 訂房優惠',
        highlight: '※ 需透過專屬連結輸入代碼「CTBCLP16」，每月限額 400 組，單筆回饋上限 1,800 點。',
        schedule: [{ month: '每月', time: '需輸入優惠代碼', limit: '每月 400 組' }],
        footer: '未輸入代碼或名額已滿享 8% 回饋。'
      },
      {
        title: '海外實體門市加碼至 5%',
        highlight: '※ 美國、日本、韓國、泰國實體商店過卡消費含原 2.8% + 加碼 2.2% (需於活動期間登錄)。',
        schedule: [{ month: '每季', time: '需登錄', limit: '每戶上限 450 點' }],
        footer: '限實體過卡交易 (含 Apple Pay/Google Pay)，網路消費不適用。'
      },
      {
        title: '脆響食/脆好購：日系名店 10% (JCB限定)',
        highlight: '※ 實體門市滿額享 10%。每月 5 號 10:00 開放登錄 (壽司郎、藏壽司、Uniqlo、GU)。',
        schedule: [{ month: '每月', time: '5號 10:00', limit: '限量登錄' }],
        footer: '每項活動月上限 100~200 點。'
      }
    ],
    channels: [
      { title: '🏨 Hotels.com (16%)', content: '專屬網頁訂房輸入「CTBCLP16」享 16% LINE POINTS。', rate: '16%' },
      { title: '🍣 脆響食日系餐飲 (10%)', content: 'JCB 卡限定。壽司郎、藏壽司、星巴克單筆滿額享 10% (需登錄)。', rate: '10%' },
      { title: '🛍️ 脆好購時尚生活 (10%)', content: 'JCB 卡限定。Uniqlo、GU 實體門市單筆滿 2,000 元享 10% (需登錄)。', rate: '10%' },
      { title: '🌏 美日韓泰實體 (5%)', content: '實體商店過卡享 5% (含原2.8%+加碼2.2%，需登錄)。', rate: '5%' }
    ]
  },
  { 
    id: 'sinopac_daway',
    bank: 'SINOPAC 永豐銀行',
    card: 'DAWAY 卡',
    name: 'LINE Pay 點數神卡',
    category: '生活',
    totalRate: 8,
    baseRate: 0.5,
    bonusRate: 7.5,
    domesticRate: 8,
    overseasRate: 10,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: 'LINE Pay 8%',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/DAWAY_Card.png',
    gradient: 'from-lime-400 to-green-600',
    textColor: 'text-black',
    link: 'https://bank.sinopac.com/sinopacbt/personal/credit-card/introduction/bankcard/DAWAY.html',
    details: [
      { label: '國內外一般', value: '0.5% (無上限)' },
      { label: 'LINE Pay 加碼', value: '+1.5% (需自動扣繳)' },
      { label: '新戶升級等級', value: '國內最高 8% / 國外最高 10%' }
    ],
    importantNotesList: [
      {
        title: 'DAWAY GO 升級條件',
        highlight: '※ 設定帳戶自動扣繳信用卡帳款 + 設定電子帳單，享 LINE Pay 加碼優惠。',
        schedule: [{ month: '常態', time: '帳單週期結算', limit: '新戶享最高8%' }],
        footer: '新戶定義：申辦日前6個月未曾持有永豐信用卡正卡者。'
      }
    ],
    channels: [
      { title: '📱 LINE Pay 全通路 (8%)', content: '全台支援 LINE Pay 實體與網路通路，新戶享最高 8%，舊戶 2% 無上限。', rate: '8%' },
      { title: '✈️ 國外實體/精選 (10%)', content: '指定海外消費符合等級最高享 10% LINE POINTS 回饋。', rate: '10%' },
      { title: '🥤 連鎖手搖飲 (加碼)', content: '50嵐、可不可、麻古茶坊等指定手搖使用 LINE Pay 享加碼折抵。', rate: '加碼' }
    ]
  },
  { 
    id: 'fubon_j',
    bank: 'FUBON 台北富邦',
    card: 'J 卡',
    name: '日韓旅遊交通首選',
    category: '旅遊',
    totalRate: 10,
    baseRate: 1,
    bonusRate: 9,
    domesticRate: 1,
    overseasRate: 10,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: '日韓交通 10%',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png',
    gradient: 'from-rose-50 via-white to-rose-100',
    textColor: 'text-rose-900',
    link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [
      { label: '國內一般消費', value: '1% (無上限)' },
      { label: '日韓泰實體', value: '3% (需設定自扣/電子帳單)' },
      { label: '日韓實體加碼', value: '+3% (需登錄，季上限600元)' },
      { label: '日本交通卡', value: '最高 10% (需登錄，季上限200元)' }
    ],
    importantNotesList: [
      {
        title: '日本三大交通卡儲值 10%',
        highlight: '※ Apple Pay 綁定 J 卡儲值 Suica、PASMO、ICOCA 單筆滿 NT$2,000 享最高 10% (季上限 200 元)。',
        schedule: [{ month: '每季', time: '季初開放登錄', limit: '每季限量 30,000 名' }],
        footer: '包含基本權益最高 3% + 本活動加碼 7%。'
      },
      {
        title: '日韓泰實體加碼 3%',
        highlight: '※ 日本、韓國、泰國實體消費加碼 3%，每季需登錄一次，季上限 600 元。',
        schedule: [{ month: '每季', time: '20號 16:00 起', limit: '限量 20,000 名' }],
        footer: '需設定台北富邦帳戶自動扣繳卡費或使用電子帳單。'
      }
    ],
    channels: [
      { title: '🚅 日本交通卡儲值 (10%)', content: 'Apple Pay 儲值 Suica/PASMO/ICOCA 單筆滿 2,000 元享 10% (需登錄)。', rate: '10%' },
      { title: '🇯🇵 日本實體消費 (6%)', content: '日本當地藥妝、百貨、餐廳、BicCamera 等過卡消費最高 6% (需登錄)。', rate: '6%' },
      { title: '🇰🇷 韓國指定通路 (10%~)', content: '韓國指定實體商店使用 LINE Pay 綁定 J 卡支付，享最高 10-12% 回饋。', rate: '12%' }
    ]
  },
  { 
    id: 'hsbc_cashback',
    bank: 'HSBC 滙豐銀行',
    card: '現金回饋御璽卡',
    name: '無腦刷無上限首選',
    category: '一般消費',
    totalRate: 2.22,
    baseRate: 1.22,
    bonusRate: 1,
    domesticRate: 1.22,
    overseasRate: 2.22,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: '無腦刷無上限',
    image: 'https://www.hsbc.com.tw/content/dam/hsbc/tw/images/credit-cards/hsbc-cash-back-card-490x306.png',
    gradient: 'from-red-600 to-red-800',
    textColor: 'text-white',
    link: 'https://www.hsbc.com.tw/credit-cards/products/cashback-signature/',
    details: [
      { label: '國內一般消費', value: '1.22% 現金回饋 (無上限)' },
      { label: '國外一般消費', value: '2.22% 現金回饋 (無上限)' },
      { label: '保費回饋', value: '1.22% (無上限，可分期)' }
    ],
    importantNotesList: [
      {
        title: '現金回饋終身有效',
        highlight: '※ 無最低消費門檻、無級距限制、自動折抵次期帳單。',
        schedule: [{ month: '常態', time: '終身有效', limit: '無上限' }],
        footer: '國外消費不含歐盟及英國實體門市。'
      }
    ],
    channels: [
      { title: '🇹🇼 國內一般全通路 (1.22%)', content: '不限通路、不需登錄、不需搶名額，無腦刷享 1.22% 回饋。', rate: '1.22%' },
      { title: '✈️ 海外消費 (2.22%)', content: '海外實體與線上刷卡享 2.22% 現金回饋無上限。', rate: '2.22%' },
      { title: '📄 保費扣繳 (1.22%)', content: '全台保險公司保費均享 1.22% 回饋無上限。', rate: '1.22%' }
    ]
  },
  { 
    id: 'sinopac_dawho',
    bank: 'SINOPAC 永豐銀行',
    card: '大戶 DAWHO 卡',
    name: '七大通路生活神卡',
    category: '旅遊',
    totalRate: 8,
    baseRate: 1,
    bonusRate: 7,
    domesticRate: 7,
    overseasRate: 8,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: '七大通路 7~8%',
    image: 'https://dawho.tw/assets/images/card/credit-card-black.png',
    gradient: 'from-neutral-900 via-black to-neutral-800',
    textColor: 'text-yellow-500',
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html',
    details: [
      { label: '國內基礎/國外基礎', value: '國內 1% / 國外 2% (無上限)' },
      { label: '大戶任務加碼', value: '+1% (需綁定大戶自動扣繳)' },
      { label: '七大通路加碼', value: '+5% (每月上限300元)' }
    ],
    channels: [
      { title: '✈️ 【行】旅遊交通 (7~8%)', content: '航空公司、旅行社、免稅店、飯店、Uber、高鐵、台鐵。', rate: '7~8%' },
      { title: '🍽️ 【食】美食外送 (7%)', content: 'Uber Eats、Foodpanda、全台實體餐廳刷卡消費。', rate: '7%' },
      { title: '🎬 【樂】影音娛樂 (7%)', content: 'Netflix、Spotify、Disney+、全台電影院、KKBOX。', rate: '7%' },
      { title: '🏠 【家】居家購物 (7%)', content: 'IKEA、誠品生活、特力屋、Pinkoi。', rate: '7%' }
    ]
  },
  { 
    id: 'esun_ubear',
    bank: 'E.SUN 玉山銀行',
    card: 'U Bear 卡',
    name: '網購影音必備卡',
    category: '網購',
    totalRate: 13,
    baseRate: 1,
    bonusRate: 12,
    domesticRate: 3,
    overseasRate: 3,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: '網購 3%',
    image: 'https://www.esunbank.com.tw/bank/images/esunbank/credit_card/ubear_card.png',
    gradient: 'from-zinc-900 via-black to-zinc-900',
    textColor: 'text-yellow-400',
    link: 'https://event.esunbank.com.tw/credit/ubear/index.html',
    details: [
      { label: '一般消費', value: '1% 現金回饋' },
      { label: '指定網購/行動支付', value: '3% (當期帳單直接折抵)' },
      { label: '指定娛樂影音', value: '13% (上限100元/月)' }
    ],
    channels: [
      { title: '🛒 網購與行動支付 (3%)', content: '國內外網購、LINE Pay、街口支付、高鐵台鐵APP、訂房網。', rate: '3%' },
      { title: '🎬 指定影音平台 (13%)', content: 'Disney+、Netflix、Spotify、PlayStation、Nintendo。', rate: '13%' }
    ]
  },
  { 
    id: 'taishin_rose',
    bank: 'TAISHIN 台新銀行',
    card: '玫瑰卡',
    name: '每日自由切換權益',
    category: '一般消費',
    totalRate: 3.8,
    baseRate: 0.3,
    bonusRate: 3.5,
    domesticRate: 3.8,
    overseasRate: 3.8,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    mainTag: '切換 3.8%',
    image: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010102/TS020101010202/images/card_02.png',
    gradient: 'from-rose-400 via-rose-300 to-pink-200',
    textColor: 'text-rose-900',
    link: 'https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/cg013/card0001/',
    details: [
      { label: '一般消費', value: '0.3% 台新 Point' },
      { label: '指定權益切換', value: '3.8% (天天刷/大筆刷/好饗刷)' },
      { label: '海外實體', value: '3.8% (日韓歐美免切換)' }
    ],
    channels: [
      { title: '🏪 天天刷 (3.8%)', content: '全家、7-11(台新Pay)、家樂福、中油、台灣大車隊、Uber。', rate: '3.8%' },
      { title: '🛍️ 大筆刷 (3.8%)', content: '新光三越、SOGO、遠東百貨、momo、蝦皮、PChome、淘寶。', rate: '3.8%' },
      { title: '🍽️ 好饗刷 (3.8%)', content: '全台餐廳、Uber Eats、Foodpanda、星巴克、路易莎。', rate: '3.8%' }
    ]
  }
];

const ALL_CATEGORIES = [...new Set(INITIAL_CAMPAIGNS.map(c => c.category))];
const ALL_CARDS = [...new Set(INITIAL_CAMPAIGNS.map(c => c.card))];

const CardVisual = ({ image, gradient, textColor, cardName, bankName, uiStyle }) => {
  const [imageError, setImageError] = useState(false);
  const cardSize = "w-36 h-[91px] md:w-44 md:h-[111px]"; // 1.58:1 Ratio
  
  return (
    <div className={`relative ${cardSize} perspective-1000 flex-shrink-0 group-hover:z-20 mt-1 self-end md:self-auto ${uiStyle === 'korean' ? 'perspective-none' : ''}`}>
      {!imageError && image ? (
        <img src={image} alt={cardName} className={`w-full h-full object-cover shadow-lg transition-all duration-300 ease-out ${uiStyle === 'korean' ? 'rounded-3xl scale-95' : 'rounded-xl transform rotate-6 group-active:rotate-0'}`} onError={() => setImageError(true)} />
      ) : (
        <div className={`w-full h-full shadow-md rounded-xl transform rotate-6 transition-all duration-300 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10 group-active:rotate-0`}>
             <div className={`text-[9px] uppercase opacity-80 italic ${textColor} font-serif truncate`}>{bankName.split(' ')[0]}</div>
             <div className="flex justify-between items-end"><div className={`text-[11px] font-bold italic ${textColor} font-serif mt-0.5 truncate`}>{cardName}</div><CreditCard size={14} className={`opacity-50 ${textColor}`} /></div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [prefs, setPrefs] = useState({
    registeredIds: [],
    isDarkMode: true,
    uiStyle: 'nyc',
    selectedCards: ALL_CARDS,
    selectedCategories: ALL_CATEGORIES,
    cardOrder: INITIAL_CAMPAIGNS.map(c => c.id)
  });

  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  // --- 初始化驗證 ---
  useEffect(() => {
    const startAuth = async () => {
      if (!auth) { setIsReady(true); return; }
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); setIsReady(true); }
    };
    startAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsReady(true);
    });
    return unsub;
  }, []);

  // --- 雲端資料即時同步 ---
  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data();
        const allCurrentIds = INITIAL_CAMPAIGNS.map(c => c.id);
        const cloudOrder = cloudData.cardOrder || [];
        const validOrder = cloudOrder.filter(id => allCurrentIds.includes(id));
        const newIds = allCurrentIds.filter(id => !validOrder.includes(id));
        
        setPrefs(prev => ({
          ...prev,
          ...cloudData,
          cardOrder: [...validOrder, ...newIds]
        }));
      }
      setIsReady(true);
    }, (err) => { console.error(err); setIsReady(true); });
    return () => unsubscribe();
  }, [user]);

  const syncToCloud = async (newData) => {
    if (!user || !db) return;
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
      await setDoc(docRef, newData, { merge: true });
    } catch (err) { console.error(err); }
    setIsSyncing(false);
  };

  const updatePrefs = (updates) => {
    const nextPrefs = { ...prefs, ...updates };
    setPrefs(nextPrefs);
    syncToCloud(nextPrefs);
  };

  const filteredCampaigns = useMemo(() => {
    const filtered = INITIAL_CAMPAIGNS.filter(c => {
      if (!prefs.selectedCards.includes(c.card)) return false;
      if (!prefs.selectedCategories.includes(c.category)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.card.toLowerCase().includes(q) || c.bank.toLowerCase().includes(q);
      }
      return true;
    });
    return filtered.sort((a,b) => prefs.cardOrder.indexOf(a.id) - prefs.cardOrder.indexOf(b.id));
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
        font: "font-['Playfair_Display']", 
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
        font: "font-['DynaPuff']", 
        rounded: 'rounded-3xl', 
        btn: 'rounded-2xl' 
      };
    }
  }, [prefs]);

  if (!isReady) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <RefreshCw className="animate-spin text-amber-500" size={24} />
    </div>
  );

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} ${theme.text} font-sans flex justify-center overflow-x-hidden touch-pan-y`}>
      <div className={`w-full max-w-md ${theme.bg} min-h-screen flex flex-col shadow-2xl relative overscroll-x-none`}>
      
      {/* 雲端同步狀態小藥丸 */}
      {isSyncing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-xl animate-pulse">
          <Cloud size={12}/> 同步中
        </div>
      )}

      {/* REORDER MODAL */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-sm max-h-[70vh] flex flex-col ${theme.rounded} shadow-2xl bg-zinc-900 border border-white/10 p-4`}>
                <div className="flex justify-between items-center mb-4 text-white">
                  <h3 className="font-bold">自訂順序</h3>
                  <button onClick={() => setIsReorderOpen(false)}><X/></button>
                </div>
                <div className="overflow-y-auto space-y-2">
                    {INITIAL_CAMPAIGNS.slice().sort((a,b) => prefs.cardOrder.indexOf(a.id) - prefs.cardOrder.indexOf(b.id)).map((card, idx, arr) => (
                        <div key={card.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-white">
                            <span className="text-sm">{card.card}</span>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    const next = [...prefs.cardOrder];
                                    if (idx > 0) [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
                                    updatePrefs({ cardOrder: next });
                                }} className={idx === 0 ? 'opacity-20' : ''}><ArrowUp size={18}/></button>
                                <button onClick={() => {
                                    const next = [...prefs.cardOrder];
                                    if (idx < arr.length-1) [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
                                    updatePrefs({ cardOrder: next });
                                }} className={idx === arr.length-1 ? 'opacity-20' : ''}><ArrowDown size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      )}

      {/* FILTER MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm flex flex-col ${theme.rounded} bg-zinc-900 border border-white/10 p-6`}>
              <div className="flex justify-between items-center mb-6 text-white font-bold text-xl">
                <h3>篩選設定</h3>
                <button onClick={() => setIsFilterOpen(false)}><X/></button>
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {ALL_CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => updatePrefs({ 
                      selectedCategories: prefs.selectedCategories.includes(cat) 
                        ? prefs.selectedCategories.filter(c => c !== cat) 
                        : [...prefs.selectedCategories, cat] 
                    })} 
                    className={`px-4 py-2 text-xs border rounded-full transition-all ${
                      prefs.selectedCategories.includes(cat) 
                        ? 'bg-amber-500 text-black border-transparent font-bold' 
                        : 'bg-transparent border-white/20 text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl shadow-lg">完成</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-black/5 p-4 ${theme.bg}`}>
        <div className="flex justify-between items-start mb-4">
            <h1 className={`text-3xl font-black tracking-tighter uppercase leading-[0.85] ${theme.font}`}>
              Reward<span className={`block text-2xl mt-1 ${theme.accent}`}>Engine.</span>
            </h1>
            <div className="flex gap-2">
                <button onClick={() => updatePrefs({ uiStyle: prefs.uiStyle === 'nyc' ? 'korean' : 'nyc' })} className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10">
                  {prefs.uiStyle === 'nyc' ? <Palette size={14}/> : <Heart size={14} fill="currentColor" className={theme.accent}/>}
                </button>
                <button onClick={() => updatePrefs({ isDarkMode: !prefs.isDarkMode })} className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10">
                  {prefs.isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                </button>
            </div>
        </div>
        <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 opacity-20" size={16}/>
            <input type="text" placeholder="搜尋通路與卡片..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2 text-sm bg-transparent border border-black/10 ${theme.btn} focus:outline-none focus:border-amber-500`} />
        </div>
        <div className="flex items-center justify-between border-t border-black/5 pt-3">
           <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? theme.accent : 'opacity-40'}>Index</button>
              <button onClick={() => setViewMode('compare')} className={viewMode === 'compare' ? theme.accent : 'opacity-40'}>Rankings</button>
           </div>
           <div className="flex gap-2">
               <button onClick={() => setIsReorderOpen(true)} className="p-1 opacity-30"><ArrowUpDown size={14}/></button>
               <button onClick={() => setIsFilterOpen(true)} className="text-[10px] font-bold uppercase tracking-widest px-2">篩選</button>
           </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full px-4 py-6">
        {viewMode === 'list' ? (
          <div className="grid gap-6">
            {filteredCampaigns.map((c) => {
              const isReg = prefs.registeredIds.includes(c.id);
              const isExp = expandedId === c.id;
              return (
                <article key={c.id} onClick={() => setExpandedId(isExp ? null : c.id)} className="group relative">
                  {isReg && <div className={`absolute right-0 -top-3 ${theme.accentBg} text-white text-[9px] font-bold px-2 py-0.5 z-10 ${theme.btn} shadow-lg`}>已登錄</div>}
                  <div className={`relative ${theme.uiStyle === 'nyc' ? 'border-t-2 border-black/10 pt-4' : `p-5 ${theme.cardBg} ${theme.rounded} shadow-xl shadow-black/5`}`}>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-start">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = isReg ? prefs.registeredIds.filter(i => i !== c.id) : [...prefs.registeredIds, c.id];
                                updatePrefs({ registeredIds: next });
                            }} className={`w-9 h-9 flex-shrink-0 border transition-all flex items-center justify-center ${theme.btn} ${isReg ? `${theme.accentBg} border-transparent text-white` : 'border-black/10'}`}>
                              {isReg && <Check size={18} strokeWidth={3}/>}
                            </button>
                            <CardVisual image={c.image} gradient={c.gradient} textColor={c.textColor} cardName={c.card} bankName={c.bank} uiStyle={prefs.uiStyle} />
                            <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
                                <div className="space-y-0.5">
                                  <div className={`text-[10px] font-bold ${theme.accent}`}>{c.bank}</div>
                                  <div className={`text-lg leading-tight font-bold ${theme.font} break-words`}>{c.card}</div>
                                </div>
                                <div className="flex gap-2 text-[9px] font-bold opacity-50">
                                  <span className={`border border-black/10 px-1.5 py-0.5 ${theme.btn}`}>{c.mainTag}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-baseline gap-2 border-t border-dashed border-black/5 pt-2">
                          <span className="text-[9px] opacity-30 tracking-widest uppercase">Max Reward</span>
                          <div className="text-4xl font-black">{c.totalRate}%</div>
                        </div>
                    </div>
                    {isExp && (
                      <div className="mt-4 pt-4 border-t border-dashed border-white/5 animate-in fade-in slide-in-from-top-2">
                        <ul className="space-y-2 mb-4">
                            {c.details.map((d, i) => (
                              <li key={i} className="flex justify-between text-xs font-mono">
                                <span>{d.label}</span>
                                <b>{d.value}</b>
                              </li>
                            ))}
                        </ul>
                        <div className="grid gap-2">
                            {c.channels.map((ch, i) => (
                                <div key={i} className="p-3 bg-black/5 rounded-xl">
                                  <div className="flex justify-between font-bold text-xs mb-1">
                                    <span>{ch.title}</span>
                                    <span className={theme.accent}>{ch.rate}</span>
                                  </div>
                                  <p className="text-[10px] opacity-60 leading-relaxed">{ch.content}</p>
                                </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* RANKINGS VIEW */
          <div className="space-y-12">
            {['🇹🇼 國內回饋排名', '✈️ 海外回饋排名'].map(title => {
                const isDom = title.includes('國內');
                const winner = [...INITIAL_CAMPAIGNS].sort((a,b) => isDom ? b.domesticRate - a.domesticRate : b.overseasRate - a.overseasRate)[0];
                return (
                    <div key={title} className="text-center p-8 bg-black/5 rounded-[2rem] border border-black/5 shadow-2xl shadow-black/10">
                        <div className="text-[10px] font-bold opacity-30 tracking-[0.3em] mb-2 uppercase">{isDom ? 'Domestic King' : 'Overseas King'}</div>
                        <h3 className={`text-2xl font-black mb-4 ${theme.font}`}>{title}</h3>
                        <div className="text-6xl font-serif italic mb-6 text-transparent bg-clip-text bg-gradient-to-br from-amber-500 via-amber-200 to-amber-600">{isDom ? winner.domesticRate : winner.overseasRate}%</div>
                        <div className="mb-8">
                          <div className="font-bold text-lg">{winner.card}</div>
                          <div className="text-xs opacity-40">{winner.bank}</div>
                        </div>
                        <div className="flex justify-center scale-110">
                          <CardVisual image={winner.image} gradient={winner.gradient} textColor={winner.textColor} cardName={winner.card} bankName={winner.bank} uiStyle={prefs.uiStyle} />
                        </div>
                    </div>
                )
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-16 border-t border-black/5 text-center opacity-30">
        <h2 className="text-sm font-black italic tracking-tighter mb-4 opacity-50">REWARD ENGINE</h2>
        <div className="text-[9px] font-mono leading-relaxed uppercase tracking-[0.2em]">
          &copy; 2026 DESIGNED BY<br/>
          <span className="text-[11px] font-bold text-black dark:text-white tracking-widest mt-1 block">TZU YIN WANG (SARAH)</span><br/>
          CLOUD SYNC ENABLED
        </div>
        <div className="mt-8 flex justify-center gap-6 opacity-30"><Smartphone size={14}/><Globe size={14}/><Cloud size={14}/></div>
      </footer>
      </div>
    </div>
  );
};

export default App;
