import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { 
  Check, Calendar, ArrowUpRight, Clock, Sun, Moon, Gift, Plus, 
  ChevronDown, ChevronUp, Star, Zap, ShoppingBag, Plane, Coffee, 
  ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, 
  Utensils, Music, Gamepad, GraduationCap, Cat, Home, CreditCard, 
  RefreshCw, Search, Palette, Heart, ArrowUpDown, ArrowUp, ArrowDown,
  Cloud, CloudOff, Trophy, MapPin, Smartphone
} from 'lucide-react';

// --- Firebase 配置 (由環境動態注入) ---
const firebaseConfig = JSON.parse(__firebase_config);
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'reward-engine-pro';

// --- 銀行資料庫 ---
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

// --- 信用卡資料庫 (2025 最新版) ---
const INITIAL_CAMPAIGNS = [
  { 
    id: 'ctbc_linepay', bank: 'CTBC 中國信託', card: 'LINE Pay 卡', name: 'LINE POINTS 生態圈', category: '一般消費', totalRate: 16, baseRate: 1, bonusRate: 15, domesticRate: 1, overseasRate: 5, startDate: '2025-07-01', endDate: '2025-12-31', mainTag: '點數回饋',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/images/card_01.png', gradient: 'from-green-400 to-green-600', textColor: 'text-white', link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html',
    details: [{ label: '國內一般', value: '1% (無上限)' }, { label: '國外實體', value: '2.8% (無上限)' }, { label: '指定通路', value: '最高 16% (需登錄)' }],
    importantNotesList: [
        { title: '脆響食：指定日系餐飲 10%', highlight: '※ JCB 卡限定。壽司郎、藏壽司、摩斯漢堡。每月 5 號 10:00 登錄。', schedule: [{ month: '每月', time: '5號 10:00', limit: '需登錄' }], footer: '回饋上限 100 點。' },
        { title: '脆好購：Uniqlo/GU 10%', highlight: '※ JCB 卡限定。實體門市單筆滿 2,000 元享 10%。', schedule: [{ month: '每月', time: '5號 10:00', limit: '需登錄' }], footer: '回饋上限 200 點。' },
        { title: 'Hotels.com 16%', highlight: '※ 指定連結 + 代碼「CTBCLP16」。', schedule: [{ month: '每月', time: '名額有限', limit: '400組' }], footer: '單筆上限 1,800 點。' }
    ],
    channels: [{ title: '🏨 Hotels.com', content: '專屬網頁訂房，輸入「CTBCLP16」享 16% LINE POINTS。', rate: '16%' }, { title: '🌏 美日韓泰實體', content: '需登錄。國外實體商店消費享 5% (含原2.8%+加碼2.2%)。', rate: '5%' }, { title: '🥤 脆響食通路', content: 'JCB 限定。50嵐、星巴克、壽司郎、藏壽司享 10%。', rate: '10%' }]
  },
  { 
    id: 'hsbc_cashback', bank: 'HSBC 滙豐銀行', card: '現金回饋御璽卡', name: '無腦刷首選', category: '一般消費', totalRate: 2.22, baseRate: 1.22, bonusRate: 1, domesticRate: 1.22, overseasRate: 2.22, startDate: '2025-01-01', endDate: '2025-12-31', mainTag: '無腦刷',
    image: 'https://www.hsbc.com.tw/content/dam/hsbc/tw/images/credit-cards/hsbc-cash-back-card-490x306.png', gradient: 'from-red-600 to-red-800', textColor: 'text-white', link: 'https://www.hsbc.com.tw/credit-cards/products/cashback-signature/',
    details: [{ label: '國內消費', value: '1.22% (無上限)' }, { label: '國外消費', value: '2.22% (無上限)' }, { label: '保費', value: '1.22% (無上限)' }],
    channels: [{ title: '🇹🇼 國內無腦刷', content: '不限通路，國內一般消費享 1.22% 現金回饋無上限。', rate: '1.22%' }, { title: '✈️ 國外無腦刷', content: '不限通路，海外一般消費 2.22% 現金回饋無上限。', rate: '2.22%' }]
  },
  { 
    id: 'sinopac_daway', bank: 'SINOPAC 永豐銀行', card: 'DAWAY 卡', name: 'LINE Pay 神卡', category: '生活', totalRate: 6, baseRate: 0.5, bonusRate: 5.5, domesticRate: 6, overseasRate: 6, startDate: '2025-07-01', endDate: '2025-12-31', mainTag: 'LINE Pay 6%',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/DAWAY_Card.png', gradient: 'from-lime-400 to-green-600', textColor: 'text-black', link: 'https://bank.sinopac.com/sinopacbt/personal/credit-card/introduction/bankcard/DAWAY.html',
    details: [{ label: '國內外一般', value: '0.5%' }, { label: 'LINE Pay 加碼', value: '+1.5% (無上限)' }, { label: '新戶加碼', value: '+4% (上限300)' }],
    channels: [{ title: '📱 LINE Pay 全通路', content: '新戶 6% (加碼4%上限300/月)，舊戶 2% 無上限。', rate: '6%' }]
  },
  { 
    id: 'fubon_j', bank: 'FUBON 台北富邦', card: 'J 卡', name: '日韓旅遊推薦', category: '旅遊', totalRate: 10, baseRate: 1, bonusRate: 9, domesticRate: 1, overseasRate: 10, startDate: '2025-10-01', endDate: '2025-12-31', mainTag: '日韓 10%',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png', gradient: 'from-rose-50 via-white to-rose-100', textColor: 'text-rose-900', link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [{ label: '國內一般', value: '1%' }, { label: '日韓加碼', value: '最高 10% (需登錄)' }],
    channels: [{ title: '🚅 日本交通卡', content: 'Apple Pay 儲值 Suica/PASMO 享 10% (需登錄)。', rate: '10%' }]
  }
];

const ALL_CATEGORIES = [...new Set(INITIAL_CAMPAIGNS.map(c => c.category))];
const ALL_CARDS = BANK_HIERARCHY.flatMap(b => b.cards);

// --- 視覺元件 ---
const CardVisual = ({ image, gradient, textColor, cardName, bankName, uiStyle }) => {
  const [imageError, setImageError] = useState(false);
  const ratioClass = "w-32 h-20 md:w-44 md:h-28";
  return (
    <div className={`relative ${ratioClass} perspective-1000 flex-shrink-0 group-hover:z-20 mt-1 self-end md:self-auto ${uiStyle === 'korean' ? 'perspective-none' : ''}`}>
      {!imageError && image ? (
        <img src={image} alt={cardName} className={`w-full h-full object-cover shadow-lg transition-all duration-300 ease-out ${uiStyle === 'korean' ? 'rounded-3xl scale-95' : 'rounded-xl transform rotate-6 group-active:rotate-0'}`} onError={() => setImageError(true)} />
      ) : (
        <div className={`w-full h-full shadow-md rounded-xl transform rotate-6 transition-all duration-300 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10 group-active:rotate-0`}>
             <div className={`text-[10px] uppercase opacity-80 italic ${textColor} font-serif truncate`}>{bankName.split(' ')[0]}</div>
             <div className="flex justify-between items-end"><div className={`text-xs font-bold italic ${textColor} font-serif truncate`}>{cardName}</div><CreditCard size={14} className={`opacity-50 ${textColor}`} /></div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

const App = () => {
  // --- 狀態定義 ---
  const [user, setUser] = useState(null);
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  const [lastUpdated] = useState("2025/12/31");

  // --- Firebase Auth ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth failed", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsCloudLoading(false);
    });
  }, []);

  // --- Firestore Sync (Rule 1 & Rule 3) ---
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const cloud = snap.data();
        const allIds = INITIAL_CAMPAIGNS.map(c => c.id);
        const cloudOrder = cloud.cardOrder || [];
        const finalOrder = [...cloudOrder.filter(id => allIds.includes(id)), ...allIds.filter(id => !cloudOrder.includes(id))];
        setPrefs(prev => ({ ...prev, ...cloud, cardOrder: finalOrder }));
      } else {
        saveToCloud(prefs);
      }
      setIsCloudLoading(false);
    }, (err) => { setIsCloudLoading(false); });
    return () => unsubscribe();
  }, [user]);

  const saveToCloud = async (newData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userPrefs', 'settings');
      await setDoc(docRef, newData, { merge: true });
    } catch (err) { console.error("Save failed", err); }
    setIsSaving(false);
  };

  const updatePrefs = (updates) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    saveToCloud(next);
  };

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
    return filtered.sort((a,b) => prefs.cardOrder.indexOf(a.id) - prefs.cardOrder.indexOf(b.id));
  }, [prefs, searchQuery]);

  const theme = useMemo(() => {
    if (prefs.uiStyle === 'nyc') {
      return { bg: prefs.isDarkMode ? 'bg-[#09090b]' : 'bg-[#f0f0f0]', text: prefs.isDarkMode ? 'text-white' : 'text-black', subText: 'text-neutral-400', cardBg: prefs.isDarkMode ? 'bg-[#141414]' : 'bg-white', cardBorder: 'border-neutral-800', accent: 'text-[#D4AF37]', accentBg: 'bg-[#D4AF37]', fontDisplay: "font-['Playfair_Display']", rounded: 'rounded-none', btn: 'rounded-full' };
    } else {
      return { bg: prefs.isDarkMode ? 'bg-[#2D2D3A]' : 'bg-[#FDFBF7]', text: prefs.isDarkMode ? 'text-slate-100' : 'text-slate-700', subText: 'text-slate-400', cardBg: prefs.isDarkMode ? 'bg-[#3A3A4A]' : 'bg-white', cardBorder: 'border-transparent', accent: prefs.isDarkMode ? 'text-violet-400' : 'text-rose-400', accentBg: prefs.isDarkMode ? 'bg-violet-400' : 'bg-rose-300', fontDisplay: "font-['DynaPuff']", rounded: 'rounded-3xl', btn: 'rounded-2xl' };
    }
  }, [prefs]);

  if (isCloudLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCw className="animate-spin text-amber-500" /></div>;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} ${theme.text} font-sans flex justify-center overflow-x-hidden touch-pan-y`}>
      <div className={`w-full max-w-md ${theme.bg} flex flex-col shadow-2xl relative overscroll-x-none`}>
      
      {/* 雲端同步狀態 */}
      {isSaving && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-xl animate-pulse"><Cloud size={12}/>同步中...</div>}

      {/* REORDER MODAL */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-sm max-h-[70vh] flex flex-col ${theme.rounded} shadow-2xl bg-zinc-900 border border-white/10`}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center"><h3 className="font-bold">自訂卡片順序</h3><button onClick={() => setIsReorderOpen(false)}><X/></button></div>
                <div className="overflow-y-auto p-4 space-y-2">
                    {INITIAL_CAMPAIGNS.slice().sort((a,b) => prefs.cardOrder.indexOf(a.id) - prefs.cardOrder.indexOf(b.id)).map((card, idx, arr) => (
                        <div key={card.id} className={`flex items-center justify-between p-3 border border-white/5 ${theme.btn} bg-white/5`}>
                            <span className="text-sm">{card.card}</span>
                            <div className="flex gap-1">
                                <button onClick={() => {
                                    const newOrder = [...prefs.cardOrder];
                                    if (idx > 0) [newOrder[idx], newOrder[idx-1]] = [newOrder[idx-1], newOrder[idx]];
                                    updatePrefs({ cardOrder: newOrder });
                                }} className={idx === 0 ? 'opacity-20' : ''}><ArrowUp size={18}/></button>
                                <button onClick={() => {
                                    const newOrder = [...prefs.cardOrder];
                                    if (idx < arr.length-1) [newOrder[idx], newOrder[idx+1]] = [newOrder[idx+1], newOrder[idx]];
                                    updatePrefs({ cardOrder: newOrder });
                                }} className={idx === arr.length-1 ? 'opacity-20' : ''}><ArrowDown size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-opacity-90 border-b border-black/5 pt-4 pb-4 ${theme.bg}`}>
        <div className="w-full px-4">
          <div className="flex justify-between items-start mb-4">
              <h1 className={`text-3xl font-black tracking-tighter uppercase leading-[0.85] ${theme.fontDisplay}`}>Reward<span className={`block text-2xl mt-1 ${theme.accent}`}>Engine.</span></h1>
              <div className="flex gap-2">
                  <button onClick={() => updatePrefs({ uiStyle: prefs.uiStyle === 'nyc' ? 'korean' : 'nyc' })} className={`w-8 h-8 flex items-center justify-center rounded-full border border-white/10`}>{prefs.uiStyle === 'nyc' ? <Palette size={14}/> : <Heart size={14} className={theme.accent} fill="currentColor"/>}</button>
                  <button onClick={() => updatePrefs({ isDarkMode: !prefs.isDarkMode })} className={`w-8 h-8 flex items-center justify-center rounded-full border border-white/10`}>{prefs.isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}</button>
              </div>
          </div>
          <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 opacity-30" size={16}/>
              <input type="text" placeholder="搜尋通路 (如 Uber, 全聯...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2 text-sm bg-transparent border border-white/10 ${theme.btn} focus:outline-none focus:border-amber-500`} />
          </div>
          <div className="flex items-center justify-between border-t border-black/5 py-2">
             <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? theme.accent : 'opacity-40'}>Index</button>
                <button onClick={() => setViewMode('compare')} className={viewMode === 'compare' ? theme.accent : 'opacity-40'}>Rankings</button>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setIsReorderOpen(true)} className="p-2 opacity-40"><ArrowUpDown size={14}/></button>
                 <button onClick={() => setIsFilterOpen(true)} className="text-[10px] font-bold uppercase tracking-widest px-2">篩選</button>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="w-full px-4 py-6">
        {viewMode === 'list' ? (
          <div className="grid gap-6">
            {filteredCampaigns.map((c) => {
              const isReg = prefs.registeredIds.includes(c.id);
              const isExp = expandedId === c.id;
              return (
                <article key={c.id} onClick={() => setExpandedId(isExp ? null : c.id)} className={`group relative transition-all duration-500`}>
                  {isReg && <div className={`absolute right-0 -top-3 ${theme.accentBg} text-white text-[9px] font-bold px-2 py-0.5 z-10 ${theme.btn} shadow-lg`}>已登錄</div>}
                  <div className={`relative ${theme.uiStyle === 'nyc' ? 'border-t-2 border-white/10' : `p-5 ${theme.cardBg} ${theme.rounded} shadow-xl`} pt-4`}>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-start">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = isReg ? prefs.registeredIds.filter(i => i !== c.id) : [...prefs.registeredIds, c.id];
                                updatePrefs({ registeredIds: next });
                            }} className={`w-9 h-9 flex-shrink-0 border transition-all flex items-center justify-center ${theme.btn} ${isReg ? `${theme.accentBg} border-transparent text-white` : 'border-white/10'}`}>{isReg && <Check size={18} strokeWidth={3}/>}</button>
                            <CardVisual image={c.image} gradient={c.gradient} textColor={c.textColor} cardName={c.card} bankName={c.bank} uiStyle={prefs.uiStyle} />
                            <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
                                <div className="space-y-0.5"><div className={`text-[10px] font-bold ${theme.accent}`}>{c.bank}</div><div className={`text-lg leading-tight font-bold ${theme.fontDisplay}`}>{c.card}</div></div>
                                <div className="flex flex-wrap gap-2 text-[9px] font-bold opacity-50"><span className={`border border-white/10 px-1.5 py-0.5 ${theme.btn}`}>{c.mainTag}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-end items-baseline gap-2 border-t border-dashed border-white/5 pt-2"><span className="text-[10px] opacity-40">MAX REWARD</span><div className="text-4xl font-black">{c.totalRate}%</div></div>
                    </div>
                    {isExp && (
                      <div className="mt-4 pt-4 border-t border-dashed border-white/5 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-[10px] font-bold mb-3 opacity-40 uppercase tracking-widest">回饋細節</h4>
                        <ul className="space-y-2 mb-4">
                            {c.details.map((d, i) => (<li key={i} className="flex justify-between text-xs font-mono"><span>{d.label}</span><b>{d.value}</b></li>))}
                        </ul>
                        <div className="grid gap-2">
                            {c.channels.map((ch, i) => (
                                <div key={i} className="p-3 bg-white/5 rounded-xl"><div className="flex justify-between font-bold text-xs mb-1"><span>{ch.title}</span><span className={theme.accent}>{ch.rate}</span></div><p className="text-[10px] opacity-60 leading-relaxed">{ch.content}</p></div>
                            ))}
                        </div>
                        {c.importantNotesList && <div className="mt-4 space-y-2">
                            {c.importantNotesList.map((n, i) => (
                                <div key={i} className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-xl text-[10px]"><div className="font-bold flex items-center gap-1 mb-1 text-amber-500"><AlertTriangle size={10}/>{n.title}</div><p>{n.highlight}</p></div>
                            ))}
                        </div>}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="space-y-12">
            {['🇹🇼 國內消費霸主', '✈️ 海外消費霸主'].map(title => {
                const isDom = title.includes('國內');
                const winner = [...INITIAL_CAMPAIGNS].sort((a,b) => isDom ? b.domesticRate - a.domesticRate : b.overseasRate - a.overseasRate)[0];
                return (
                    <div key={title} className="text-center p-8 bg-white/5 rounded-[2rem] border border-white/5">
                        <div className="text-[10px] font-bold opacity-30 tracking-[0.3em] mb-2 uppercase">{isDom ? 'Domestic King' : 'Overseas King'}</div>
                        <h3 className={`text-2xl font-black mb-4 ${theme.fontDisplay}`}>{title}</h3>
                        <div className="text-6xl font-serif italic mb-6 text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-100">{isDom ? winner.domesticRate : winner.overseasRate}%</div>
                        <div className="mb-8"><div className="font-bold text-lg">{winner.card}</div><div className="text-xs opacity-40">{winner.bank}</div></div>
                        <div className="flex justify-center scale-110"><CardVisual image={winner.image} gradient={winner.gradient} textColor={winner.textColor} cardName={winner.card} bankName={winner.bank} uiStyle={prefs.uiStyle} /></div>
                    </div>
                )
            })}
          </div>
        )}
      </main>

      <footer className="py-16 border-t border-white/5 text-center opacity-30">
        <h2 className="text-sm font-black italic tracking-tighter mb-4">REWARD ENGINE</h2>
        <div className="text-[9px] font-mono leading-relaxed uppercase tracking-[0.2em]">
          &copy; 2025 DESIGNED BY<br/>
          <span className="text-[11px] font-bold text-white">TZU YIN WANG (SARAH)</span><br/>
          CLOUD SYNC ENABLED
        </div>
        <div className="mt-8 flex justify-center gap-4 opacity-50"><Smartphone size={14}/><Globe size={14}/><CloudCheck size={14}/></div>
      </footer>
      </div>
    </div>
  );
};

export default App;

