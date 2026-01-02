import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  Check, Calendar, ArrowUpRight, Clock, Sun, Moon, Gift, Plus, 
  ChevronDown, ChevronUp, Star, Zap, ShoppingBag, Plane, Coffee, 
  ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, 
  Utensils, Music, Gamepad, GraduationCap, Cat, Home, CreditCard, 
  RefreshCw, Search, Palette, Heart, ArrowUpDown, ArrowUp, ArrowDown,
  Cloud, CloudCheck, CloudOff
} from 'lucide-react';

// --- Firebase 配置 (由環境提供) ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'reward-engine';

// --- 銀行與卡別層級資料庫 ---
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

// --- 模擬數據資料庫 ---
const INITIAL_CAMPAIGNS = [
  { 
    id: 'fubon_j', bank: 'FUBON 台北富邦', card: 'J 卡', name: '日韓旅遊/交通回饋', category: '旅遊', totalRate: 10, baseRate: 1, bonusRate: 9, domesticRate: 1, overseasRate: 10, startDate: '2025-10-01', endDate: '2025-12-31', mainTag: '日韓旅遊',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png', gradient: 'from-rose-50 via-white to-rose-100', textColor: 'text-rose-900', link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [{ label: '國內一般消費', value: '1% LINE POINTS' }, { label: '日韓原權益', value: '3% 無上限' }, { label: '實體活動加碼', value: '+3% (需登錄)' }, { label: '交通卡/超商', value: '最高 10% (需登錄)' }],
    importantNotesList: [
        { title: '活動一：日韓泰實體消費加碼', highlight: '※ 日韓實體加碼 3%。每季需登錄一次。', schedule: [{ month: '10月', time: '10/20 16:00', limit: '2萬名' }, { month: '11月', time: '11/20 16:00', limit: '2萬名' }, { month: '12月', time: '12/20 16:00', limit: '2萬名' }], footer: '季上限 600 元。' },
        { title: '活動二：日本交通卡 / 韓國指定通路', highlight: '※ Apple Pay 儲值 Suica/PASMO/ICOCA 享 10%。', schedule: [{ month: '10月', time: '10/18 16:00', limit: '1萬名' }, { month: '11月', time: '11/18 16:00', limit: '1萬名' }, { month: '12月', time: '12/18 16:00', limit: '1萬名' }], footer: '季上限 200 元。' }
    ],
    channels: [{ title: '🚅 日本交通卡', content: 'Apple Pay 儲值 Suica/PASMO/ICOCA。單筆需滿 2,000 日圓。', rate: '10%' }, { title: '🇯🇵 日本實體消費', content: '日本實體店家消費，含藥妝、百貨、餐廳。', rate: '6%' }]
  },
  { 
    id: 'sinopac_daway', bank: 'SINOPAC 永豐銀行', card: 'DAWAY 卡', name: 'LINE Pay 神卡', category: '生活', totalRate: 6, baseRate: 0.5, bonusRate: 5.5, domesticRate: 6, overseasRate: 6, startDate: '2025-07-01', endDate: '2025-12-31', mainTag: 'LINE Pay 6%',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/DAWAY_Card.png', gradient: 'from-lime-400 to-green-600', textColor: 'text-black', link: 'https://bank.sinopac.com/sinopacbt/personal/credit-card/introduction/bankcard/DAWAY.html',
    details: [{ label: '國內外一般', value: '0.5% 無上限' }, { label: 'LINE Pay 加碼', value: '+1.5% (需代扣繳)' }, { label: '新戶再加碼', value: '+4% (上限300元)' }],
    channels: [{ title: '📱 LINE Pay 通路', content: '全台 LINE Pay 實體與網路商店。新戶 6%，舊戶 2% 無上限。', rate: '6%' }, { title: '🥤 指定手搖飲', content: '50嵐、可不可、麻古等指定手搖 10% (含 LINE Pay)。', rate: '10%' }]
  },
  {
    id: 'ctbc_linepay', bank: 'CTBC 中國信託', card: 'LINE Pay 卡', name: 'LINE POINTS 生態圈', category: '一般消費', totalRate: 16, baseRate: 1, bonusRate: 15, domesticRate: 1, overseasRate: 5, startDate: '2025-07-01', endDate: '2025-12-31', mainTag: '點數回饋',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/images/card_01.png', gradient: 'from-green-400 to-green-600', textColor: 'text-white', link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html',
    details: [{ label: '國內一般消費', value: '1%' }, { label: '國外實體消費', value: '2.8% (無上限)' }, { label: '指定通路加碼', value: '最高 16% (需登錄)' }],
    importantNotesList: [
        { title: 'Hotels.com 16%', highlight: '需代碼「CTBCLP16」。', schedule: [{ month: '每月', time: '名額有限', limit: '400組' }], footer: '上限 1,800 點。' },
        { title: '海外實體 5%', highlight: '美日韓泰實體 5%。需登錄。', schedule: [{ month: 'Q4', time: '需登錄', limit: '上限 450 點' }], footer: '限實體刷卡。' }
    ],
    channels: [{ title: '🏨 Hotels.com', content: '專屬連結 + 代碼「CTBCLP16」最高 16%。', rate: '16%' }, { title: '🛍️ Uniqlo/GU', content: 'JCB 卡限定實體 10%。每月 5 號登錄。', rate: '10%' }]
  },
  {
    id: 'hsbc_cashback', bank: 'HSBC 滙豐銀行', card: '現金回饋御璽卡', name: '無腦刷首選', category: '一般消費', totalRate: 2.22, baseRate: 1.22, bonusRate: 1, domesticRate: 1.22, overseasRate: 2.22, startDate: '2025-01-01', endDate: '2025-12-31', mainTag: '無腦刷',
    image: 'https://www.hsbc.com.tw/content/dam/hsbc/tw/images/credit-cards/hsbc-cash-back-card-490x306.png', gradient: 'from-red-600 to-red-800', textColor: 'text-white', link: 'https://www.hsbc.com.tw/credit-cards/products/cashback-signature/',
    details: [{ label: '國內一般', value: '1.22% 無上限' }, { label: '海外一般', value: '2.22% 無上限' }, { label: '保費', value: '1.22% 無上限' }],
    channels: [{ title: '🌏 海外消費', content: '海外一般消費 2.22% (不含歐盟實體)。', rate: '2.22%' }, { title: '🇹🇼 國內消費', content: '國內一般消費 (含保費) 1.22% 無上限。', rate: '1.22%' }]
  }
];

const ALL_CATEGORIES = [...new Set(INITIAL_CAMPAIGNS.map(c => c.category))];
const ALL_CARDS = BANK_HIERARCHY.flatMap(b => b.cards);

// --- 獨立元件：卡片視覺呈現 ---
const CardVisual = ({ image, gradient, textColor, cardName, bankName, uiStyle }) => {
  const [imageError, setImageError] = useState(false);
  return (
    <div className={`relative w-32 h-20 md:w-44 md:h-28 perspective-1000 z-0 flex-shrink-0 group-hover:z-20 mt-1 md:mt-0 self-end md:self-auto ${uiStyle === 'korean' ? 'perspective-none' : ''}`}>
      {!imageError && image ? (
        <img src={image} alt={cardName} className={`w-full h-full object-cover shadow-lg transition-all duration-300 ease-out ${uiStyle === 'korean' ? 'rounded-3xl rotate-0 scale-95' : 'rounded-xl transform rotate-6 md:rotate-6 md:-translate-y-2 group-active:rotate-0'}`} onError={() => setImageError(true)} />
      ) : (
        <div className={`w-full h-full shadow-md rounded-xl transform rotate-6 transition-all duration-300 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10 group-active:rotate-0`}>
             <div className={`text-[10px] uppercase opacity-80 italic ${textColor} font-serif truncate`}>{bankName.split(' ')[0]}</div>
             <div className="flex justify-between items-end"><div className={`text-xs font-bold italic ${textColor} font-serif mt-0.5 truncate`}>{cardName}</div><CreditCard size={14} className={`opacity-50 ${textColor}`} /></div>
        </div>
      )}
      <div className={`absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none mix-blend-overlay ${uiStyle === 'korean' ? 'rounded-3xl' : 'rounded-xl'}`}></div>
    </div>
  );
};

const App = () => {
  // --- 狀態管理 ---
  const [user, setUser] = useState(null);
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 使用者偏好資料 (雲端同步)
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
  const [expandedFilterBanks, setExpandedFilterBanks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("2025/12/10");

  // --- Firebase 身份驗證 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error", err);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsCloudLoading(false);
    });
  }, []);

  // --- 雲端資料同步讀取 (Real-time Sync) ---
  useEffect(() => {
    if (!user) return;

    // 定義存儲路徑 (Rule 1: /artifacts/{appId}/users/{userId}/{collectionName})
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
    
    // 使用 onSnapshot 監聽雲端更新 (網頁關掉，App 開啟時會自動讀取最新)
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        
        // 智慧合併：確保新加入的卡片 ID 出現在排序列表中
        const allCurrentIds = INITIAL_CAMPAIGNS.map(c => c.id);
        const cloudOrder = cloudData.cardOrder || [];
        const newIds = allCurrentIds.filter(id => !cloudOrder.includes(id));
        const finalOrder = [...cloudOrder.filter(id => allCurrentIds.includes(id)), ...newIds];

        setPrefs(prev => ({
          ...prev,
          ...cloudData,
          cardOrder: finalOrder,
          // 確保如果是第一次使用的欄位有預設值
          selectedCards: cloudData.selectedCards || ALL_CARDS,
          selectedCategories: cloudData.selectedCategories || ALL_CATEGORIES
        }));
      } else {
        // 如果是新用戶，初始化雲端資料
        saveToCloud(prefs);
      }
      setIsCloudLoading(false);
    }, (err) => {
      console.error("Firestore sync error", err);
      setIsCloudLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- 雲端資料儲存邏輯 ---
  const saveToCloud = async (newData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
      await setDoc(docRef, newData, { merge: true });
    } catch (err) {
      console.error("Save failed", err);
    }
    setIsSaving(false);
  };

  // 當使用者在 App 內操作時，觸發同步
  const updatePrefs = (updates) => {
    const nextPrefs = { ...prefs, ...updates };
    setPrefs(nextPrefs);
    saveToCloud(nextPrefs); // 每次異動都同步到雲端
  };

  const toggleRegistration = (e, id) => {
    e.stopPropagation();
    const newIds = prefs.registeredIds.includes(id) 
      ? prefs.registeredIds.filter(i => i !== id) 
      : [...prefs.registeredIds, id];
    updatePrefs({ registeredIds: newIds });
  };

  const moveCard = (id, direction) => {
      const currentIndex = prefs.cardOrder.indexOf(id);
      if (currentIndex === -1) return;
      const newOrder = [...prefs.cardOrder];
      if (direction === 'up' && currentIndex > 0) {
          [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
          [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      }
      updatePrefs({ cardOrder: newOrder });
  };

  const filteredCampaigns = useMemo(() => {
    const filtered = INITIAL_CAMPAIGNS.filter(c => {
      const matchesFilter = prefs.selectedCards.includes(c.card) && prefs.selectedCategories.includes(c.category);
      if (!matchesFilter) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return c.card.toLowerCase().includes(query) || c.bank.toLowerCase().includes(query) || 
               c.channels.some(ch => ch.title.toLowerCase().includes(query) || ch.content.toLowerCase().includes(query));
      }
      return true;
    });
    return filtered.sort((a, b) => prefs.cardOrder.indexOf(a.id) - prefs.cardOrder.indexOf(b.id));
  }, [prefs, searchQuery]);

  const theme = useMemo(() => {
    if (prefs.uiStyle === 'nyc') {
        return {
            bg: prefs.isDarkMode ? 'bg-[#09090b]' : 'bg-[#f0f0f0]', text: prefs.isDarkMode ? 'text-white' : 'text-black', subText: 'text-neutral-400',
            cardBg: prefs.isDarkMode ? 'bg-[#141414]' : 'bg-white', cardBorder: 'border-neutral-800', accent: 'text-[#D4AF37]', accentBg: 'bg-[#D4AF37]',
            fontDisplay: "font-['Playfair_Display']", fontBody: 'font-sans', rounded: 'rounded-none', buttonShape: 'rounded-full'
        };
    } else {
        return {
            bg: prefs.isDarkMode ? 'bg-[#2D2D3A]' : 'bg-[#FDFBF7]', text: prefs.isDarkMode ? 'text-slate-100' : 'text-slate-700', subText: 'text-slate-400',
            cardBg: prefs.isDarkMode ? 'bg-[#3A3A4A]' : 'bg-white', cardBorder: 'border-transparent', accent: prefs.isDarkMode ? 'text-violet-400' : 'text-rose-400', 
            accentBg: prefs.isDarkMode ? 'bg-violet-400' : 'bg-rose-300', fontDisplay: "font-['DynaPuff']", fontBody: 'font-sans', rounded: 'rounded-3xl', buttonShape: 'rounded-2xl'
        };
    }
  }, [prefs]);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} ${theme.text} ${theme.fontBody} flex justify-center overflow-x-hidden touch-pan-y`}>
      <div className={`w-full max-w-md ${theme.bg} min-h-screen flex flex-col shadow-2xl relative overscroll-x-none`}>
      
      {/* 雲端同步狀態提示 (iOS 風格小藥丸) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          {isCloudLoading ? (
            <div className="bg-black/80 text-white px-3 py-1 rounded-full text-[10px] flex items-center gap-2 backdrop-blur-md border border-white/10 shadow-lg">
                <RefreshCw size={10} className="animate-spin" /> 連線中...
            </div>
          ) : isSaving ? (
            <div className="bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] flex items-center gap-2 shadow-lg font-bold">
                <Cloud size={10} className="animate-bounce" /> 同步中
            </div>
          ) : null}
      </div>

      {/* REORDER & FILTER MODALS */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-sm max-h-[70vh] flex flex-col ${theme.rounded === 'rounded-none' ? 'rounded-xl' : 'rounded-[1.5rem]'} shadow-2xl relative ${theme.cardBg} border ${theme.cardBorder}`}>
                <div className={`p-4 border-b ${theme.cardBorder} flex justify-between items-center`}><h3 className="text-lg font-bold">自訂卡片順序</h3><button onClick={() => setIsReorderOpen(false)}><X size={20} /></button></div>
                <div className="overflow-y-auto p-4 space-y-2">
                    {INITIAL_CAMPAIGNS.slice().sort((a,b) => prefs.cardOrder.indexOf(a.id) - prefs.cardOrder.indexOf(b.id)).map((card, idx, arr) => (
                        <div key={card.id} className={`flex items-center justify-between p-3 border ${theme.cardBorder} ${theme.buttonShape} ${prefs.isDarkMode?'bg-white/5':'bg-black/5'}`}>
                            <span className="text-sm">{card.card}</span>
                            <div className="flex gap-1">
                                <button onClick={() => moveCard(card.id, 'up')} disabled={idx === 0} className={`p-1.5 rounded ${idx === 0 ? 'opacity-30' : ''}`}><ArrowUp size={16} /></button>
                                <button onClick={() => moveCard(card.id, 'down')} disabled={idx === arr.length - 1} className={`p-1.5 rounded ${idx === arr.length - 1 ? 'opacity-30' : ''}`}><ArrowDown size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      )}

      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm max-h-[85vh] flex flex-col ${theme.rounded === 'rounded-none' ? 'rounded-2xl' : 'rounded-[2rem]'} shadow-2xl relative ${theme.cardBg} ${theme.cardBorder} border`}>
            <div className={`p-6 border-b ${theme.cardBorder} flex justify-between items-center shrink-0`}>
                <h3 className={`text-2xl ${theme.fontDisplay} italic`}>Filter</h3>
                <button onClick={() => setIsFilterOpen(false)}><X size={24} /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-8 flex-1">
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme.accent}`}>類別</h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => updatePrefs({ selectedCategories: prefs.selectedCategories.includes(cat) ? prefs.selectedCategories.filter(c => c !== cat) : [...prefs.selectedCategories, cat] })} className={`px-3 py-2 text-xs border transition-all ${theme.buttonShape} ${prefs.selectedCategories.includes(cat) ? `${theme.accentBg} text-white border-transparent` : `bg-transparent ${theme.cardBorder}`}`}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-between items-center">
               <button onClick={() => updatePrefs({ selectedCards: ALL_CARDS, selectedCategories: ALL_CATEGORIES })} className="text-xs uppercase opacity-50">全選</button>
               <button onClick={() => setIsFilterOpen(false)} className={`px-8 py-3 ${theme.accentBg} text-white text-sm font-bold uppercase tracking-wider ${theme.buttonShape}`}>套用</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-opacity-90 transition-all border-b border-black/5 pt-4 pb-4 ${theme.bg}`}>
        <div className="w-full px-4">
          <div className="flex justify-between items-start mb-4">
              <h1 className={`text-3xl font-black tracking-tighter uppercase leading-[0.85] ${theme.fontDisplay}`}>Reward<span className={`block text-2xl mt-1 ${theme.accent}`}>Engine.</span></h1>
              <div className="flex gap-2 items-center">
                  <div className="flex flex-col items-end mr-1"><span className="text-[8px] opacity-40">SYNCED</span><span className={`text-[8px] font-mono ${theme.accent}`}>{lastUpdated}</span></div>
                  <button onClick={() => updatePrefs({ uiStyle: prefs.uiStyle === 'nyc' ? 'korean' : 'nyc' })} className={`w-8 h-8 flex items-center justify-center rounded-full border ${theme.cardBorder} shadow-sm`}>{prefs.uiStyle === 'nyc' ? <Palette size={14} /> : <Heart size={14} className={theme.accent} fill="currentColor" />}</button>
                  <button onClick={() => updatePrefs({ isDarkMode: !prefs.isDarkMode })} className={`w-8 h-8 flex items-center justify-center rounded-full border ${theme.cardBorder} shadow-sm`}>{prefs.isDarkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
              </div>
          </div>
          <div className="relative w-full mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="opacity-30" /></div>
              <input type="text" placeholder="搜尋通路 (Uber, 全聯...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2 text-sm bg-transparent border ${theme.cardBorder} ${theme.buttonShape} focus:outline-none focus:border-amber-500`} />
          </div>
          <div className="flex items-center justify-between border-t border-black/5 py-3">
             <div className="flex gap-4 text-xs font-bold tracking-widest uppercase">
                <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? theme.accent : 'opacity-40'}>Index</button>
                <button onClick={() => setViewMode('compare')} className={viewMode === 'compare' ? theme.accent : 'opacity-40'}>Rankings</button>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setIsReorderOpen(true)} className={`w-8 h-8 flex items-center justify-center rounded-full border ${theme.cardBorder}`}><ArrowUpDown size={14} className="opacity-50" /></button>
                 <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 text-[10px] tracking-widest uppercase border border-transparent ${theme.buttonShape} hover:bg-black/5 px-2`}>篩選</button>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full px-4 py-6">
        {viewMode === 'list' ? (
          <div className="grid gap-6">
            {filteredCampaigns.map((campaign, idx) => {
              const isRegistered = prefs.registeredIds.includes(campaign.id);
              const isExpanded = expandedId === campaign.id;
              return (
                <article key={campaign.id} onClick={() => setExpandedId(isExpanded ? null : campaign.id)} className={`group relative transition-all duration-500 ${isRegistered ? '' : 'hover:-translate-y-1'}`}>
                  {isRegistered && <div className={`absolute right-0 -top-4 flex items-center gap-1 text-[10px] font-bold uppercase ${theme.accentBg} text-white px-3 py-1 z-10 shadow-lg ${theme.buttonShape}`}><Check size={12} strokeWidth={3} /> 已登錄</div>}
                  <div className={`relative ${theme.uiStyle === 'nyc' ? 'border-t-2' : `p-6 ${theme.cardBg} shadow-xl ${theme.rounded}`} ${isRegistered ? theme.accentBorder : (prefs.isDarkMode ? 'border-white/20' : 'border-black/10')} pt-4`}>
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex gap-4 items-start">
                        <button onClick={(e) => toggleRegistration(e, campaign.id)} className={`relative w-10 h-10 flex-shrink-0 border transition-all flex items-center justify-center ${theme.buttonShape} ${isRegistered ? `${theme.accentBg} border-transparent text-white` : `bg-transparent ${theme.cardBorder}`}`}>{isRegistered && <Check size={20} strokeWidth={3} />}</button>
                        <CardVisual image={campaign.image} gradient={campaign.gradient} textColor={campaign.textColor} cardName={campaign.card} bankName={campaign.bank} uiStyle={prefs.uiStyle} />
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
                          <div><h3 className={`text-[10px] font-bold uppercase mb-1 ${theme.accent} truncate`}>{campaign.bank}</h3><a className={`text-xl font-bold ${theme.fontDisplay} truncate block`}>{campaign.card}</a></div>
                          <div className="flex flex-wrap gap-2 text-[10px] font-bold opacity-60"><span className={`border ${theme.cardBorder} px-2 py-1 ${theme.buttonShape}`}>{campaign.mainTag}</span><span>{campaign.startDate}</span></div>
                        </div>
                      </div>
                      <div className="flex justify-end items-baseline gap-2 border-t border-dashed border-white/10 pt-2"><span className="text-[10px] opacity-40">MAX REWARD</span><div className="text-4xl font-black">{campaign.totalRate}%</div></div>
                    </div>
                    {isExpanded && (
                      <div className={`pt-4 ${theme.uiStyle === 'nyc' ? 'border-t border-dashed border-white/10' : 'mt-4 bg-black/5 rounded-2xl p-4'}`}>
                        <h4 className="text-xs font-bold mb-4 uppercase border-l-2 border-amber-500 pl-3">回饋結構與通路</h4>
                        <ul className="space-y-2 mb-6">
                          {campaign.details.map((d, i) => (<li key={i} className="flex justify-between text-xs font-mono"><span className="opacity-60">{d.label}</span><b>{d.value}</b></li>))}
                        </ul>
                        <div className="grid gap-3">
                          {campaign.channels.map((ch, i) => (
                            <div key={i} className={`p-4 rounded-xl ${prefs.isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}><div className="flex justify-between items-center mb-1"><span className="text-sm font-bold">{ch.title}</span><span className={`font-bold ${theme.accent}`}>{ch.rate}</span></div><p className="text-[11px] opacity-60">{ch.content}</p></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-16">
            {['🇹🇼 國內消費', '✈️ 國外消費'].map((area) => {
              const isDomestic = area.includes('國內');
              const sorted = [...INITIAL_CAMPAIGNS].sort((a,b) => isDomestic ? b.domesticRate - a.domesticRate : b.overseasRate - a.overseasRate);
              const winner = sorted[0];
              return (
                <div key={area} className="border-b border-white/10 pb-12 text-center">
                    <div className="text-[10px] tracking-widest opacity-50 mb-2">{isDomestic ? 'DOMESTIC KING' : 'OVERSEAS KING'}</div>
                    <h3 className={`text-3xl font-black mb-4 ${theme.fontDisplay}`}>{area}</h3>
                    <div className={`text-7xl font-serif italic mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-200`}>{isDomestic ? winner.domesticRate : winner.overseasRate}%</div>
                    <div className="flex flex-col items-center gap-2"><span className="text-lg font-bold">{winner.card}</span><span className="text-xs opacity-50">{winner.bank}</span></div>
                    <div className="mt-8 transform scale-110"><CardVisual image={winner.image} gradient={winner.gradient} textColor={winner.textColor} cardName={winner.card} bankName={winner.bank} uiStyle={prefs.uiStyle} /></div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-white/10 text-center opacity-40">
        <h2 className="text-sm font-black italic tracking-tighter mb-4">REWARD ENGINE</h2>
        <div className="flex justify-center gap-6 text-[9px] uppercase tracking-widest mb-6"><span>SYNC</span><span>CLOUD</span><a href="https://www.threads.com/@w.tzuyin">THREADS</a></div>
        <div className="text-[9px] font-mono leading-relaxed">
          &copy; 2025 DESIGNED BY <br/>
          <span className="text-[11px] font-bold text-white/80">TZU YIN WANG (SARAH)</span><br/>
          ALL RIGHTS RESERVED.
        </div>
      </footer>
      </div>
    </div>
  );
};

export default App;

