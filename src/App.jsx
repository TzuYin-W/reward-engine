import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Check, Clock, Sun, Moon, Plus, ChevronDown, ChevronUp, Star, 
  ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, 
  CreditCard, RefreshCw, Search, Palette, Heart, ArrowUpDown, 
  ArrowUp, ArrowDown, Trophy, MapPin, Smartphone
} from 'lucide-react';

let db = null;
let auth = null;
let appId = 'reward-engine-pro';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    if (getApps().length === 0) {
      const config = JSON.parse(__firebase_config);
      const app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  }
  if (typeof __app_id !== 'undefined' && __app_id) {
    appId = String(__app_id).replace(/[^a-zA-Z0-9_-]/g, '_');
  }
} catch (e) {
  console.warn("Firebase initialization skipped, running in local storage mode.");
}

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
    startDate: '2025-01-01', 
    endDate: '2026-12-31', 
    mainTag: '點數回饋',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/images/card_01.png', 
    gradient: 'from-green-500 to-emerald-700', 
    textColor: 'text-white', 
    link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html',
    details: [
      { label: '國內一般消費', value: '1% LINE POINTS (無上限)' }, 
      { label: '國外實體消費', value: '2.8% LINE POINTS (無上限)' }, 
      { label: '指定通路加碼', value: '最高 16% (需登錄/輸入代碼)' }
    ],
    importantNotesList: [
      { 
        title: '脆響食：日系餐飲 10%', 
        highlight: '※ JCB 卡限定。壽司郎、藏壽司、摩斯漢堡。每月 5 號 10:00 登錄。', 
        schedule: [{ month: '每月', time: '5號 10:00 起', limit: '限量登錄' }], 
        footer: '回饋上限 100 點/月。' 
      },
      { 
        title: '脆好購：Uniqlo/GU 10%', 
        highlight: '※ JCB 卡限定。實體門市單筆滿 2,000 元享 10%。每月 5 號 10:00 登錄。', 
        schedule: [{ month: '每月', time: '5號 10:00 起', limit: '限量登錄' }], 
        footer: '回饋上限 200 點/月。' 
      },
      { 
        title: 'Hotels.com 16% 訂房', 
        highlight: '※ 需經指定連結並輸入「CTBCLP16」，名額有限。', 
        schedule: [{ month: '每月', time: '需輸入優惠碼', limit: '400組' }], 
        footer: '單筆上限 1,800 點。' 
      }
    ],
    channels: [
      { title: '🏨 Hotels.com (16%)', content: '專屬網頁訂房並輸入優惠碼，享最高 16% LINE POINTS。', rate: '16%' }, 
      { title: '🌏 美日韓泰實體 (5%)', content: '海外實體商店消費加碼至 5% (含原2.8%+加碼2.2%)，需登錄。', rate: '5%' }, 
      { title: '🍱 日系時尚/餐飲 (10%)', content: 'Uniqlo, GU, 壽司郎, 藏壽司滿額享 10% (JCB 限定)。', rate: '10%' }
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
    startDate: '2025-01-01', 
    endDate: '2026-12-31', 
    mainTag: '無腦刷',
    image: 'https://www.hsbc.com.tw/content/dam/hsbc/tw/images/credit-cards/hsbc-cash-back-card-490x306.png', 
    gradient: 'from-red-600 to-red-800', 
    textColor: 'text-white', 
    link: 'https://www.hsbc.com.tw/credit-cards/products/cashback-signature/',
    details: [
      { label: '國內一般消費', value: '1.22% (無上限)' }, 
      { label: '國外一般消費', value: '2.22% (無上限)' }, 
      { label: '保費回饋', value: '1.22% (無上限)' }
    ],
    importantNotesList: [
      {
        title: '現金回饋自動折抵',
        highlight: '※ 回饋終身有效，自動折抵帳單金額，無最低消費門檻。',
        schedule: [{ month: '常態', time: '帳單自動折抵', limit: '無上限' }],
        footer: '海外不含歐盟及英國實體通路。'
      }
    ],
    channels: [
      { title: '🇹🇼 國內全通路 (1.22%)', content: '不限通路與保費，1.22% 現金回饋自動折抵次期帳單。', rate: '1.22%' }, 
      { title: '✈️ 海外全通路 (2.22%)', content: '海外一般消費享 2.22% 現金回饋無上限 (不含歐盟實體)。', rate: '2.22%' }
    ]
  },
  { 
    id: 'sinopac_daway', 
    bank: 'SINOPAC 永豐銀行', 
    card: 'DAWAY 卡', 
    name: 'LINE Pay 特選', 
    category: '生活', 
    totalRate: 6, 
    baseRate: 0.5, 
    bonusRate: 5.5, 
    domesticRate: 6, 
    overseasRate: 6, 
    startDate: '2025-07-01', 
    endDate: '2026-12-31', 
    mainTag: 'LINE Pay 6%',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/DAWAY_Card.png', 
    gradient: 'from-lime-400 to-green-600', 
    textColor: 'text-black', 
    link: 'https://bank.sinopac.com/sinopacbt/personal/credit-card/introduction/bankcard/DAWAY.html',
    details: [
      { label: '國內外一般', value: '0.5% (無上限)' }, 
      { label: 'LINE Pay 加碼', value: '+1.5% (需設定大戶自動扣繳)' }, 
      { label: '新戶首年加碼', value: '+4% (上限300元/月)' }
    ],
    channels: [
      { title: '📱 LINE Pay 全通路 (6%)', content: '新戶綁定 LINE Pay 享最高 6%，舊戶享 2% 無上限。', rate: '6%' },
      { title: '🥤 指定手搖飲 (10%)', content: '50嵐、清心、可不可、麻古茶坊等指定手搖加碼。', rate: '10%' }
    ]
  },
  { 
    id: 'fubon_j', 
    bank: 'FUBON 台北富邦', 
    card: 'J 卡', 
    name: '日韓旅遊神卡', 
    category: '旅遊', 
    totalRate: 10, 
    baseRate: 1, 
    bonusRate: 9, 
    domesticRate: 1, 
    overseasRate: 10, 
    startDate: '2025-10-01', 
    endDate: '2026-12-31', 
    mainTag: '日韓 10%',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png', 
    gradient: 'from-rose-50 via-white to-rose-100', 
    textColor: 'text-rose-900', 
    link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [
      { label: '國內一般消費', value: '1% LINE POINTS' }, 
      { label: '日韓實體消費', value: '3% (無上限)' }, 
      { label: '實體活動加碼', value: '+3% (需登錄，季上限600元)' }, 
      { label: '交通卡加碼', value: '+7% (需登錄，季上限200元)' }
    ],
    channels: [
      { title: '🚅 日本交通卡 (10%)', content: 'Apple Pay 綁定儲值 Suica/PASMO/ICOCA 滿額享 10%。', rate: '10%' },
      { title: '🇯🇵 日本實體消費 (6%)', content: '日本當地實體店家消費，含藥妝、百貨、餐廳、BicCamera。', rate: '6%' }
    ]
  },
  {
    id: 'taishin_rose', 
    bank: 'TAISHIN 台新銀行', 
    card: '玫瑰卡', 
    name: '自由切換權益', 
    category: '一般消費', 
    totalRate: 3.8, 
    baseRate: 0.3, 
    bonusRate: 3.5, 
    domesticRate: 3.8, 
    overseasRate: 3.8, 
    startDate: '2025-01-01', 
    endDate: '2026-12-31', 
    mainTag: '切換 3.8%',
    image: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010102/TS020101010202/images/card_02.png', 
    gradient: 'from-rose-300 to-pink-500', 
    textColor: 'text-white', 
    link: 'https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/cg013/card0001/',
    details: [
      { label: '一般消費', value: '0.3% 台新 Point' }, 
      { label: '指定切換權益', value: '3.8% (天天刷/大筆刷/好饗刷)' },
      { label: '日韓歐美消費', value: '3.8% (免切換)' }
    ],
    channels: [
      { title: '🔄 權益切換 (3.8%)', content: '天天刷(超商/量販)、大筆刷(百貨/網購)、好饗刷(餐飲/外送)。', rate: '3.8%' }
    ]
  },
  { 
    id: 'sinopac_dawho', 
    bank: 'SINOPAC 永豐銀行', 
    card: '大戶 DAWHO 現金回饋卡', 
    name: '七大通路高回饋', 
    category: '旅遊', 
    totalRate: 7, 
    baseRate: 1, 
    bonusRate: 6, 
    domesticRate: 7, 
    overseasRate: 8, 
    startDate: '2025-01-01', 
    endDate: '2026-12-31', 
    mainTag: '大戶 7%',
    image: 'https://dawho.tw/assets/images/card/credit-card-black.png', 
    gradient: 'from-neutral-900 to-black', 
    textColor: 'text-yellow-500', 
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html',
    details: [
      { label: '國內一般消費', value: '1% (無上限)' }, 
      { label: '國外一般消費', value: '2% (無上限)' }, 
      { label: '七大指定通路', value: '+5% (月上限300元)' }
    ],
    channels: [
      { title: '✈️ 旅遊行樂 (7%~8%)', content: '機票、飯店、旅行社、高鐵、Uber、Netflix、Spotify。', rate: '8%' }
    ]
  },
  { 
    id: 'cathay_cube', 
    bank: 'CATHAY 國泰世華', 
    card: 'CUBE 卡', 
    name: '多重權益切換', 
    category: '旅遊', 
    totalRate: 3.5, 
    baseRate: 0.3, 
    bonusRate: 3.2, 
    domesticRate: 3.3, 
    overseasRate: 3.5, 
    startDate: '2025-01-01', 
    endDate: '2026-12-31', 
    mainTag: '多重權益',
    image: 'https://www.cathaybk.com.tw/cathaybk/-/media/C1ce1986-7786-4f24-862a-350734057863.png', 
    gradient: 'from-gray-200 to-gray-400', 
    textColor: 'text-gray-800', 
    link: 'https://www.cathaybk.com.tw/cathaybk/personal/product/credit-card/cards/cube/',
    details: [
      { label: '一般消費', value: '0.3% 小樹點' }, 
      { label: '指定方案加碼', value: '3% (每日可切換方案)' }, 
      { label: '日本賞專案', value: '3.5% (指定日系門市)' }
    ],
    channels: [
      { title: '🇯🇵 日本賞 (3.5%)', content: '日本實體消費、JR東日本、唐吉訶德、迪士尼樂園。', rate: '3.5%' },
      { title: '🛒 玩數位 (3%)', content: '蝦皮、momo、PChome、淘寶、App Store、Google Play。', rate: '3%' }
    ]
  },
  { 
    id: 'esun_ubear', 
    bank: 'E.SUN 玉山銀行', 
    card: 'U Bear 卡', 
    name: '網購影音神卡', 
    category: '網購', 
    totalRate: 13, 
    baseRate: 1, 
    bonusRate: 12, 
    domesticRate: 3, 
    overseasRate: 3, 
    startDate: '2025-01-01', 
    endDate: '2026-12-31', 
    mainTag: '網購 3%',
    image: 'https://www.esunbank.com.tw/bank/images/esunbank/credit_card/ubear_card.png', 
    gradient: 'from-zinc-900 to-black', 
    textColor: 'text-yellow-400', 
    link: 'https://event.esunbank.com.tw/credit/ubear/index.html',
    details: [
      { label: '國內外一般', value: '1%' }, 
      { label: '指定網路消費', value: '3% (含行動支付)' }, 
      { label: '指定影音娛樂', value: '13% (上限100元)' }
    ],
    channels: [
      { title: '🛒 網路購物 (3%)', content: '國內外網購、LINE Pay、街口支付、高鐵台鐵APP。', rate: '3%' },
      { title: '🎬 影音平台 (13%)', content: 'Disney+、Netflix、Spotify、PlayStation、Nintendo。', rate: '13%' }
    ]
  }
];

const ALL_CATEGORIES = [...new Set(INITIAL_CAMPAIGNS.map(c => c.category))];
const ALL_CARDS = BANK_HIERARCHY.flatMap(b => b.cards);

const CardVisual = ({ image, gradient, textColor, cardName, bankName, uiStyle }) => {
  const [imageError, setImageError] = useState(false);
  const cardSize = "w-36 h-[91px] md:w-44 md:h-[111px]";
  
  return (
    <div className={`relative ${cardSize} perspective-1000 flex-shrink-0 group-hover:z-20 mt-1 self-end md:self-auto ${uiStyle === 'korean' ? 'perspective-none' : ''}`}>
      {!imageError && image ? (
        <img 
          src={image} 
          alt={cardName} 
          className={`w-full h-full object-cover shadow-lg transition-all duration-300 ease-out ${
            uiStyle === 'korean' 
              ? 'rounded-3xl scale-95' 
              : 'rounded-xl transform rotate-6 group-active:rotate-0'
          }`} 
          onError={() => setImageError(true)} 
        />
      ) : (
        <div className={`w-full h-full shadow-md rounded-xl transform rotate-6 transition-all duration-300 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10 group-active:rotate-0`}>
          <div className={`text-[9px] uppercase opacity-80 italic ${textColor} font-serif truncate`}>
            {bankName.split(' ')[0]}
          </div>
          <div className="flex justify-between items-end">
            <div className={`text-[11px] font-bold italic ${textColor} font-serif truncate`}>
              {cardName}
            </div>
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
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('reward_engine_prefs_v2');
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

  useEffect(() => {
    if (!auth) {
      setIsReady(true);
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn("Auth error, fallback to local state.");
        setIsReady(true);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userSettings', 'prefs');
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const cloud = snap.data();
          const allIds = INITIAL_CAMPAIGNS.map(c => c.id);
          const cloudOrder = cloud.cardOrder || [];
          const validOrder = cloudOrder.filter(id => allIds.includes(id));
          const newIds = allIds.filter(id => !validOrder.includes(id));
          
          setPrefs(prev => ({
            ...prev,
            ...cloud,
            cardOrder: [...validOrder, ...newIds]
          }));
        }
      }, (err) => {
        console.warn("Firestore listener error", err);
      });
      return () => unsubscribe();
    } catch (e) {}
  }, [user]);

  const updatePrefs = (updates) => {
    const nextPrefs = { ...prefs, ...updates };
    setPrefs(nextPrefs);
    try {
      localStorage.setItem('reward_engine_prefs_v2', JSON.stringify(nextPrefs));
    } catch (e) {}

    if (user && db) {
      setIsSyncing(true);
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userSettings', 'prefs');
        setDoc(docRef, nextPrefs, { merge: true }).finally(() => {
          setIsSyncing(false);
        });
      } catch (e) {
        setIsSyncing(false);
      }
    }
  };

  const filteredCampaigns = useMemo(() => {
    const filtered = INITIAL_CAMPAIGNS.filter(c => {
      if (!prefs.selectedCards.includes(c.card)) return false;
      if (!prefs.selectedCategories.includes(c.category)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inCard = c.card.toLowerCase().includes(q);
        const inBank = c.bank.toLowerCase().includes(q);
        const inChannels = c.channels?.some(ch => ch.title.toLowerCase().includes(q) || ch.content.toLowerCase().includes(q));
        return inCard || inBank || inChannels;
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
        cardBg: prefs.isDarkMode ? 'bg-[#141414]' : 'bg-white', 
        cardBorder: prefs.isDarkMode ? 'border-neutral-800' : 'border-neutral-200',
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
        cardBg: prefs.isDarkMode ? 'bg-[#3A3A4A]' : 'bg-white', 
        cardBorder: 'border-transparent', 
        accent: prefs.isDarkMode ? 'text-violet-400' : 'text-rose-400', 
        accentBg: prefs.isDarkMode ? 'bg-violet-400' : 'bg-rose-300', 
        font: "font-['DynaPuff']", 
        rounded: 'rounded-3xl', 
        btn: 'rounded-2xl' 
      };
    }
  }, [prefs]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="animate-spin text-[#D4AF37]" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} ${theme.text} font-sans flex justify-center overflow-x-hidden touch-pan-y`}>
      <div className={`w-full max-w-md ${theme.bg} min-h-screen flex flex-col shadow-2xl relative overscroll-x-none`}>
      
      {/* 雲端同步狀態提示 */}
      {isSyncing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#D4AF37] text-black px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-xl animate-pulse">
          <RefreshCw size={12} className="animate-spin" /> 雲端同步中...
        </div>
      )}

      {/* 自訂排序 Modal */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm max-h-[75vh] flex flex-col ${theme.rounded} shadow-2xl bg-[#141414] border border-neutral-800 p-4`}>
            <div className="flex justify-between items-center mb-4 text-white">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <ArrowUpDown size={16} /> 自訂卡片順序
              </h3>
              <button onClick={() => setIsReorderOpen(false)} className="p-1 hover:opacity-70">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {INITIAL_CAMPAIGNS.slice().sort((a,b) => {
                const idxA = prefs.cardOrder.indexOf(a.id);
                const idxB = prefs.cardOrder.indexOf(b.id);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
              }).map((card, idx, arr) => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-white">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#D4AF37]">{card.bank}</span>
                    <span className="text-xs font-bold">{card.card}</span>
                  </div>
                  <div className="flex gap-1 text-white">
                    <button 
                      onClick={() => {
                        const next = [...prefs.cardOrder];
                        if (idx > 0) [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
                        updatePrefs({ cardOrder: next });
                      }} 
                      disabled={idx === 0}
                      className={`p-1.5 rounded hover:bg-white/10 ${idx === 0 ? 'opacity-20' : ''}`}
                    >
                      <ArrowUp size={16}/>
                    </button>
                    <button 
                      onClick={() => {
                        const next = [...prefs.cardOrder];
                        if (idx < arr.length-1) [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
                        updatePrefs({ cardOrder: next });
                      }} 
                      disabled={idx === arr.length-1}
                      className={`p-1.5 rounded hover:bg-white/10 ${idx === arr.length-1 ? 'opacity-20' : ''}`}
                    >
                      <ArrowDown size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 篩選 Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm flex flex-col ${theme.rounded} bg-[#141414] border border-neutral-800 p-6`}>
            <div className="flex justify-between items-center mb-6 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Filter size={16} /> 篩選項目
              </h3>
              <button onClick={() => setIsFilterOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 mb-8">
              <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">消費類別</div>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => {
                      const next = prefs.selectedCategories.includes(cat) 
                        ? prefs.selectedCategories.filter(c => c !== cat) 
                        : [...prefs.selectedCategories, cat];
                      updatePrefs({ selectedCategories: next });
                    }} 
                    className={`px-3 py-1.5 text-xs border rounded-full transition-all ${
                      prefs.selectedCategories.includes(cat) 
                        ? 'bg-[#D4AF37] text-black border-transparent font-bold' 
                        : 'bg-transparent border-white/20 text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => updatePrefs({ selectedCards: ALL_CARDS, selectedCategories: ALL_CATEGORIES })} 
                className="flex-1 py-2.5 text-xs uppercase tracking-wider border border-white/20 rounded-xl text-white hover:bg-white/5"
              >
                重設全選
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)} 
                className="flex-1 py-2.5 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER 區域 */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-black/5 p-4 ${theme.bg}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className={`text-3xl font-black tracking-tighter uppercase leading-[0.85] ${theme.font}`}>
              Reward<span className={`block text-2xl mt-1 ${theme.accent}`}>Engine.</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => updatePrefs({ uiStyle: prefs.uiStyle === 'nyc' ? 'korean' : 'nyc' })} 
              className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 shadow-sm"
              title="切換風格"
            >
              {prefs.uiStyle === 'nyc' ? <Palette size={14}/> : <Heart size={14} fill="currentColor" className={theme.accent}/>}
            </button>
            <button 
              onClick={() => updatePrefs({ isDarkMode: !prefs.isDarkMode })} 
              className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 shadow-sm"
              title="切換深淺模式"
            >
              {prefs.isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
            </button>
          </div>
        </div>
        
        {/* 搜尋欄 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 opacity-30" size={16}/>
          <input 
            type="text" 
            placeholder="搜尋通路 (如 Uber、全聯、Hotels...)" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className={`w-full pl-10 pr-4 py-2 text-xs bg-transparent border border-black/10 dark:border-white/10 ${theme.btn} focus:outline-none focus:border-[#D4AF37] transition-all`} 
          />
        </div>

        {/* 導覽列與操作鈕 */}
        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2.5">
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
            <button 
              onClick={() => setViewMode('list')} 
              className={`transition-colors ${viewMode === 'list' ? theme.accent : 'opacity-40'}`}
            >
              Index
            </button>
            <button 
              onClick={() => setViewMode('compare')} 
              className={`transition-colors ${viewMode === 'compare' ? theme.accent : 'opacity-40'}`}
            >
              Rankings
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setIsReorderOpen(true)} 
              className="p-1 opacity-40 hover:opacity-100 transition-opacity"
              title="自訂卡片排序"
            >
              <ArrowUpDown size={14}/>
            </button>
            <button 
              onClick={() => setIsFilterOpen(true)} 
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border border-black/10 dark:border-white/10 rounded-full hover:bg-black/5"
            >
              篩選
            </button>
          </div>
        </div>
      </header>

      {/* 核心內容區 */}
      <main className="w-full px-4 py-6 flex-1">
        {viewMode === 'list' ? (
          <div className="grid gap-6">
            {filteredCampaigns.map((c) => {
              const isReg = prefs.registeredIds.includes(c.id);
              const isExp = expandedId === c.id;
              
              return (
                <article key={c.id} onClick={() => setExpandedId(isExp ? null : c.id)} className="group relative cursor-pointer">
                  {isReg && (
                    <div className={`absolute right-0 -top-3 ${theme.accentBg} text-black font-black text-[9px] px-2.5 py-0.5 z-10 ${theme.btn} shadow-lg flex items-center gap-1`}>
                      <Check size={10} strokeWidth={3} /> 已登錄
                    </div>
                  )}
                  
                  <div className={`relative ${theme.uiStyle === 'nyc' ? 'border-t-2 border-black/10 dark:border-white/10 pt-4' : `p-5 ${theme.cardBg} ${theme.rounded} shadow-xl shadow-black/5`}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3 items-start">
                        {/* 登錄核取鈕 */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = isReg 
                              ? prefs.registeredIds.filter(i => i !== c.id) 
                              : [...prefs.registeredIds, c.id];
                            updatePrefs({ registeredIds: next });
                          }} 
                          className={`w-8 h-8 flex-shrink-0 border transition-all flex items-center justify-center ${theme.btn} mt-1 ${
                            isReg ? `${theme.accentBg} border-transparent text-black` : 'border-black/20 dark:border-white/20'
                          }`}
                        >
                          {isReg && <Check size={16} strokeWidth={3}/>}
                        </button>
                        
                        {/* 卡面展示 */}
                        <CardVisual 
                          image={c.image} 
                          gradient={c.gradient} 
                          textColor={c.textColor} 
                          cardName={c.card} 
                          bankName={c.bank} 
                          uiStyle={prefs.uiStyle} 
                        />
                        
                        {/* 標題與標籤 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-[91px]">
                          <div>
                            <div className={`text-[10px] font-bold ${theme.accent}`}>{c.bank}</div>
                            <div className={`text-base leading-tight font-bold ${theme.font} break-words mt-0.5`}>
                              {c.card}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[9px] font-bold opacity-60">
                            <span className={`border border-black/10 dark:border-white/10 px-1.5 py-0.5 ${theme.btn}`}>
                              {c.mainTag}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 回饋率摘要 */}
                      <div className="flex justify-end items-baseline gap-1.5 border-t border-dashed border-black/5 dark:border-white/5 pt-2">
                        <span className="text-[9px] opacity-40 tracking-wider uppercase font-bold">Max Rate</span>
                        <div className={`text-3xl font-black tracking-tight ${theme.text}`}>
                          {c.totalRate}%
                        </div>
                      </div>
                    </div>

                    {/* 展開之權益通路與注意事項 */}
                    {isExp && (
                      <div className="mt-4 pt-4 border-t border-dashed border-black/10 dark:border-white/10 space-y-4">
                        {/* 結構摘要 */}
                        <ul className="space-y-1.5">
                          {c.details.map((d, i) => (
                            <li key={i} className="flex justify-between text-xs font-mono">
                              <span className="opacity-60">{d.label}</span>
                              <b className={theme.text}>{d.value}</b>
                            </li>
                          ))}
                        </ul>

                        {/* 通路卡片清單 */}
                        <div className="grid gap-2">
                          {c.channels.map((ch, i) => (
                            <div key={i} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                              <div className="flex justify-between font-bold text-xs mb-0.5">
                                <span>{ch.title}</span>
                                <span className={theme.accent}>{ch.rate}</span>
                              </div>
                              <p className="text-[10px] opacity-60 leading-relaxed">{ch.content}</p>
                            </div>
                          ))}
                        </div>

                        {/* 重要提醒 */}
                        {c.importantNotesList && (
                          <div className="space-y-2 pt-2">
                            {c.importantNotesList.map((n, i) => (
                              <div key={i} className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-xl text-[10px]">
                                <div className="font-bold flex items-center gap-1 mb-1 text-amber-500">
                                  <AlertTriangle size={12}/> {n.title}
                                </div>
                                <p className="opacity-80 leading-relaxed">{n.highlight}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 官網跳轉連結 */}
                        <div className="pt-2 text-right">
                          <a 
                            href={c.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:underline"
                          >
                            銀行官方權益條款 <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* RANKINGS 雙榜單區域 */
          <div className="space-y-12">
            {['🇹🇼 國內回饋霸主', '✈️ 海外回饋霸主'].map(title => {
              const isDom = title.includes('國內');
              const sorted = [...INITIAL_CAMPAIGNS].sort((a,b) => 
                isDom ? (b.domesticRate || 0) - (a.domesticRate || 0) : (b.overseasRate || 0) - (a.overseasRate || 0)
              );
              const winner = sorted[0];
              const rate = isDom ? winner.domesticRate : winner.overseasRate;

              return (
                <div key={title} className="text-center p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-2xl">
                  <div className="text-[10px] font-bold opacity-40 tracking-[0.3em] mb-2 uppercase">
                    {isDom ? 'Domestic Category Winner' : 'Overseas Category Winner'}
                  </div>
                  <h3 className={`text-2xl font-black mb-2 ${theme.font}`}>{title}</h3>
                  <div className="text-6xl font-serif italic mb-4 text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] via-amber-200 to-amber-600">
                    {rate}%
                  </div>
                  <div className="mb-6">
                    <div className="font-bold text-base">{winner.card}</div>
                    <div className="text-xs opacity-50">{winner.bank}</div>
                  </div>
                  <div className="flex justify-center scale-105">
                    <CardVisual 
                      image={winner.image} 
                      gradient={winner.gradient} 
                      textColor={winner.textColor} 
                      cardName={winner.card} 
                      bankName={winner.bank} 
                      uiStyle={prefs.uiStyle} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER 區域 */}
      <footer className="py-12 border-t border-black/5 dark:border-white/5 text-center opacity-40">
        <h2 className="text-xs font-black italic tracking-widest mb-3">REWARD ENGINE</h2>
        <div className="text-[9px] font-mono leading-relaxed uppercase tracking-[0.2em]">
          &copy; 2025 DESIGNED BY<br/>
          <span className="text-[11px] font-bold text-black dark:text-white tracking-widest mt-1 block">
            TZU YIN WANG (SARAH)
          </span>
          ALL RIGHTS RESERVED
        </div>
      </footer>
      </div>
    </div>
  );
}
