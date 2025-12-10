import React, { useState, useEffect, useMemo } from 'react';
import { Check, Calendar, ArrowUpRight, Clock, Sun, Moon, Gift, Plus, ChevronDown, ChevronUp, Star, Zap, ShoppingBag, Plane, Coffee, ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, Utensils, Music, Gamepad, GraduationCap, Cat, Home, CreditCard, RefreshCw } from 'lucide-react';

// --- 銀行與卡別層級資料庫 ---
const BANK_HIERARCHY = [
  {
    name: 'CTBC 中國信託',
    code: 'CTBC',
    cards: ['All Me 卡', 'LINE Pay 卡']
  },
  {
    name: 'CATHAY 國泰世華',
    code: 'CATHAY',
    cards: ['CUBE 卡']
  },
  {
    name: 'FUBON 台北富邦',
    code: 'FUBON',
    cards: ['J 卡']
  },
  {
    name: 'TAISHIN 台新銀行',
    code: 'TAISHIN',
    cards: ['@GoGo 卡']
  },
  {
    name: 'E.SUN 玉山銀行',
    code: 'ESUN',
    cards: ['U Bear 卡']
  },
  {
    name: 'SINOPAC 永豐銀行',
    code: 'SINOPAC',
    cards: ['Sport 卡', '大戶 DAWHO 現金回饋卡', '現金回饋 JCB 卡']
  },
  {
    name: 'FEDERAL 聯邦銀行',
    code: 'FEDERAL',
    cards: ['吉鶴卡']
  }
];

// --- 模擬數據資料庫 ---
const INITIAL_CAMPAIGNS = [
  { 
    id: 'fubon_j', 
    bank: 'FUBON 台北富邦', 
    card: 'J 卡', 
    name: '日韓旅遊/交通回饋', 
    category: '旅遊', 
    totalRate: 10, 
    baseRate: 3,
    bonusRate: 7,
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '日韓旅遊',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png', 
    gradient: 'from-rose-100 via-white to-teal-50', 
    textColor: 'text-rose-900',
    link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [
      { label: '日韓原權益', value: '3% LINE POINTS (無上限)' },
      { label: '實體活動加碼', value: '+3% (需登錄，季上限600元)' },
      { label: '交通卡加碼', value: '+7% (需登錄，季上限200元)' }
    ],
    importantNotesList: [
        {
            title: '活動一：日韓泰實體消費加碼',
            highlight: '※ 日韓實體消費加碼 3%、泰國實體消費加碼 5%。每季僅需登錄一次。',
            schedule: [
                { month: '10月', time: '10/20 16:00 起', limit: '限量 20,000 名' },
                { month: '11月', time: '11/20 16:00 起', limit: '限量 20,000 名' },
                { month: '12月', time: '12/20 16:00 起', limit: '限量 20,000 名' },
            ],
            footer: '回饋上限每季 600 元，預計於次年 2 月底回饋。'
        },
        {
            title: '活動二：日本交通卡 / 韓國指定通路',
            highlight: '※ Apple Pay 儲值 Suica/PASMO/ICOCA 滿額享 10%。每季僅需登錄一次。',
            schedule: [
                { month: '10月', time: '10/18 16:00 起', limit: '限量 10,000 名' },
                { month: '11月', time: '11/18 16:00 起', limit: '限量 10,000 名' },
                { month: '12月', time: '12/18 16:00 起', limit: '限量 10,000 名' },
            ],
            footer: '回饋上限每季 200 元。需單筆滿 2,000 日圓/韓元始符合資格。'
        }
    ],
    channels: [
      { title: '🚅 日本交通卡 (10%)', content: '使用 Apple Pay 綁定 J 卡儲值：Suica (西瓜卡)、PASMO、ICOCA。單筆需滿 2,000 日圓，最高回饋 10%。', rate: '10%' },
      { title: '🇰🇷 韓國指定通路 (10%~)', content: '韓國實體商店使用 LINE Pay 綁定 J 卡支付 (需於指定商店如 Lotte Duty Free, Olive Young 等)，最高享 10-12% 回饋 (含原權益+優惠券)。', rate: '12%' },
      { title: '🇯🇵 日本實體消費 (6%)', content: '日本地區所有實體店家消費 (含藥妝、百貨、餐廳、BicCamera、遊樂園門票、超市、便利商店、機場免稅店等)。', rate: '6%' },
      { title: '🏪 當地指定便利店 (10%)', content: '日本三大超商: 7-Eleven, Lawson, FamilyMart | 韓國便利商店: CU, GS25, Emart24 (需登錄)', rate: '10%' }
    ]
  },
  {
    id: 'ctbc_linepay',
    bank: 'CTBC 中國信託',
    card: 'LINE Pay 卡',
    name: 'LINE POINTS 生態圈',
    category: '一般消費',
    totalRate: 15, 
    baseRate: 1,
    bonusRate: 14,
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    mainTag: '點數回饋',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/images/card_01.png',
    gradient: 'from-green-400 to-green-600', 
    textColor: 'text-white',
    link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html',
    details: [
        { label: '一般消費', value: '國內1% / 國外2.8% (無上限)' },
        { label: '指定通路', value: '最高 15% (Hotels.com, 等)' }
    ],
    importantNotesList: [
        {
            title: 'Hotels.com 訂房加碼',
            highlight: '※ 需使用指定連結並輸入優惠碼「CTBCLP16」享 LINE POINTS 回饋。',
            schedule: [
                { month: '每月', time: '需輸入優惠碼', limit: '每月限額 400 組' }
            ],
            footer: '每筆回饋上限 1,800 點。'
        }
    ],
    channels: [
        { title: '🏨 Hotels.com (15%)', content: '透過專屬網頁訂房，並輸入指定優惠碼，享最高 15% LINE POINTS 回饋。', rate: '15%' },
        { title: '🌏 海外實體消費 (2.8%)', content: '海外實體商店刷卡消費，享 2.8% LINE POINTS 回饋無上限。', rate: '2.8%' },
        { title: '🛍️ 日韓泰新實體 (5%)', content: '日本、韓國、泰國、新加坡實體門市消費，需登錄，加碼 2.2% (上限450點)。', rate: '5%' },
        { title: '🎬 影音娛樂 (10%)', content: 'Netflix, Disney+, Spotify 等指定影音平台消費享 10% 回饋 (需登錄)。', rate: '10%' }
    ]
  },
  {
    id: 'ctbc_allme',
    bank: 'CTBC 中國信託',
    card: 'All Me 卡',
    name: '跨生態圈回饋',
    category: '一般消費',
    totalRate: 8,
    baseRate: 1,
    bonusRate: 7,
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    mainTag: '電信/電商',
    image: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/ALLME/images/card_01.png',
    gradient: 'from-blue-500 to-cyan-400',
    textColor: 'text-white',
    link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/ALLME/index.html',
    details: [
        { label: '一般消費', value: '1% 中信點' },
        { label: '指定通路', value: '8% (需綁定 Hami Pay/Pi 錢包)' }
    ],
    channels: [
        { title: '📡 電信繳費 (8%)', content: '中華電信費 (包含5G/光世代)、Hami Video、KKBOX。', rate: '8%' },
        { title: '🛍️ PChome (8%)', content: 'PChome 24h購物 (需綁定 Pi 拍錢包或 Hami Pay)。', rate: '8%' },
        { title: '🏪 超商/超市 (8%)', content: '7-ELEVEN, 全家, 萊爾富, OK, 美廉社 (需使用 Hami Pay 感應支付)。', rate: '8%' }
    ]
  },
  {
    id: 'esun_ubear',
    bank: 'E.SUN 玉山銀行',
    card: 'U Bear 卡',
    name: '網購/影音神卡',
    category: '網購',
    totalRate: 13,
    baseRate: 1,
    bonusRate: 12,
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    mainTag: '網購 3%',
    image: 'https://www.esunbank.com.tw/bank/images/esunbank/credit_card/ubear_card.png',
    gradient: 'from-yellow-300 to-amber-500', 
    textColor: 'text-black',
    link: 'https://event.esunbank.com.tw/credit/ubear/index.html',
    details: [
        { label: '網購', value: '3% (含行動支付)' },
        { label: '指定影音', value: '13% (上限100元)' }
    ],
    channels: [
        { title: '🛒 指定網購 (3%)', content: '國內外網購、行動支付 (LINE Pay, 街口, Apple Pay等)、訂房網、高鐵台鐵APP。', rate: '3%' },
        { title: '🎬 指定影音 (13%)', content: 'Disney+, Netflix, Spotify, Nintendo, PlayStation。', rate: '13%' }
    ]
  },
  {
    id: 'federal_jihe',
    bank: 'FEDERAL 聯邦銀行',
    card: '吉鶴卡',
    name: '日本消費神卡',
    category: '旅遊',
    totalRate: 4,
    baseRate: 2.5,
    bonusRate: 1.5,
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    mainTag: '日本 4%',
    image: 'https://card.ubot.com.tw/eCard/assets/images/creditcard/JIHO/card_01.png',
    gradient: 'from-red-500 to-rose-600', 
    textColor: 'text-white',
    link: 'https://card.ubot.com.tw/eCard/activity/2025JIHO/index.htm',
    details: [
        { label: '日幣消費', value: '2.5% 無上限' },
        { label: 'QUICPay', value: '+1.5% (綁定 Apple Pay)' },
        { label: '國內', value: '1% 無上限' }
    ],
    channels: [
        { title: '🇯🇵 日本 QUICPay (4%)', content: '日本當地使用 Apple Pay 綁定吉鶴卡並選擇 QUICPay 支付，享 4% 回饋。', rate: '4%' },
        { title: '🛍️ 日系名店 (4%~)', content: 'UNIQLO, 唐吉訶德, 大創, 松本清, 日藥本舖 (加碼 4%，最高 8%~)。', rate: '8%' },
        { title: '🍽️ 日系美饌 (10%)', content: '國內指定日系餐廳 (勝博殿, 一風堂, 欣葉日本料理...) 現折 10%。', rate: '10%' }
    ]
  },
  { 
    id: 'sinopac_dawho', 
    bank: 'SINOPAC 永豐銀行', 
    card: '大戶 DAWHO 現金回饋卡', 
    name: '大戶等級七大通路', 
    category: '旅遊', 
    totalRate: 7, 
    baseRate: 2,
    bonusRate: 5,
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '國內外 7%',
    image: 'https://dawho.tw/assets/images/card/credit-card-black.png',
    gradient: 'from-neutral-900 via-black to-neutral-800', 
    textColor: 'text-yellow-500', 
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html',
    details: [
      { label: '基本回饋', value: '國內1% / 國外2% (無上限)' },
      { label: '指定任務', value: '+1% (需綁定大戶自動扣繳)' },
      { label: '七大通路', value: '+5% (上限300元/月)' }
    ],
    channels: [
      { title: '✈️ 【行】旅遊/交通', content: '旅行社、免稅店、航空公司、飯店類、Uber、高鐵、台鐵。', rate: '7%' },
      { title: '🎬 【樂】娛樂影音', content: '全台電影院、Netflix、Spotify、Disney+、KKBOX、两廳院售票。', rate: '7%' },
      { title: '🍽️ 【食】美饌佳餚', content: 'Foodpanda, Uber Eats, 國內全部餐廳實體刷卡消費。', rate: '7%' },
      { title: '🎮 【玩】電玩娛樂', content: 'PlayStation, XBOX, Steam, Nintendo', rate: '7%' },
      { title: '🎓 【學】學習進修', content: 'Hahow, Udemy, VoiceTube', rate: '7%' },
      { title: '🐱 【寵】寵物愛護', content: '東森寵物雲, 魚中魚, 動物星球', rate: '7%' },
      { title: '🏠 【家】居家生活', content: 'IKEA, 誠品生活, 特力屋, Pinkoi', rate: '7%' }
    ]
  },
  { 
    id: 'sinopac_jcb', 
    bank: 'SINOPAC 永豐銀行', 
    card: '現金回饋 JCB 卡', 
    name: '特選通路回饋', 
    category: '一般消費', 
    totalRate: 5,
    baseRate: 2,
    bonusRate: 3,
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '網購/百貨/餐飲',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/JCB_Card.png', 
    gradient: 'from-purple-900 to-indigo-900', 
    textColor: 'text-white',
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/cashcardJCB.html',
    details: [
      { label: '國內一般', value: '1% 現金回饋' },
      { label: '特選通路', value: '+3% (當期帳單滿3000)' },
      { label: '網購/百貨', value: '最高 5% (上限300元/月)' }
    ],
    channels: [
      { title: '🛍️ 百貨購物 (5%)', content: '漢神巨蛋、漢神百貨、遠東SOGO、遠東百貨、微風廣場、華泰名品城、新光三越、台北101。', rate: '5%' },
      { title: '🛒 網購平台 (5%)', content: '蝦皮購物、momo購物網、PChome、淘寶、Amazon、Coupang、東森購物。', rate: '5%' },
      { title: '🍽️ 餐廳/外送 (5%)', content: '國內所有實體餐廳(含連鎖速食/咖啡廳/火鍋/燒肉)、Uber Eats、Foodpanda', rate: '5%' }
    ]
  },
  { 
    id: 'cathay_cube', 
    bank: 'CATHAY 國泰世華', 
    card: 'CUBE 卡', 
    name: '權益切換方案', 
    category: '旅遊', 
    totalRate: 3.5,
    baseRate: 0.3,
    bonusRate: 3.2,
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '多重權益',
    image: 'https://www.cathaybk.com.tw/cathaybk/-/media/C1ce1986-7786-4f24-862a-350734057863.png', 
    gradient: 'from-gray-100 to-gray-300', 
    textColor: 'text-gray-600',
    link: 'https://www.cathaybk.com.tw/cathaybk/personal/product/credit-card/cards/cube/',
    details: [
      { label: '原始權益', value: '0.3% 小樹點' },
      { label: '任務加碼', value: '每日可切換一次權益' }
    ],
    channels: [
      { title: '🇯🇵 日本賞 (3.5%)', content: '日本實體消費、JR東日本、唐吉訶德、BicCamera、松本清、東京迪士尼、日本環球影城、阪急百貨、阪神百貨、大丸百貨、高島屋、SUIGI藥局', rate: '3.5%' },
      { title: '🛍️ 玩數位 (3%)', content: '蝦皮購物、momo購物網、PChome 24h、Yahoo奇摩、淘寶、Netflix、Disney+、Spotify、App Store、Google Play、KKBOX、Nintendo、PlayStation', rate: '3%' },
      { title: '🍽️ 樂饗購 (3%)', content: 'Uber Eats、Foodpanda、星巴克、國內餐飲實體刷卡、SOGO、新光三越、遠東百貨、康是美、路易莎、壽司郎、藏壽司、鼎泰豐、麥當勞、肯德基、必勝客', rate: '3%' },
      { title: '✈️ 趣旅行 (3%)', content: '高鐵、Uber、LINE TAXI、中油直營、Agoda、Booking.com、Klook、KKday、華航、長榮、星宇、易遊網、雄獅旅遊', rate: '3%' },
      { title: '🛒 集精選 (2%)', content: '全聯福利中心、家樂福、7-ELEVEN、全家便利商店、麥當勞、肯德基、中油直營(加油)、IKEA、宜得利家居', rate: '2%' }
    ]
  },
  { 
    id: 'taishin_gogo', 
    bank: 'TAISHIN 台新銀行', 
    card: '@GoGo 卡', 
    name: '精選行動支付/網購', 
    category: '網購', 
    totalRate: 3.8,
    baseRate: 0.5,
    bonusRate: 3.3,
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '行動支付',
    image: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010104/TS020101010409/images/card_01.png', 
    gradient: 'from-zinc-900 to-emerald-900', 
    textColor: 'text-white',
    link: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010104/TS020101010409/index.htm',
    details: [
      { label: '基本回饋', value: '0.5% 現金回饋' },
      { label: '任務加碼', value: '+3.3% (需電子帳單+Richart扣繳)' }
    ],
    channels: [
      { title: '📱 行動支付 (3.8%)', content: 'LINE Pay, 全支付, 台新Pay, 全盈+PAY (適用於超商、超市、百貨、餐廳、夜市、飲料店、計程車等支援上述支付之所有通路)', rate: '3.8%' },
      { title: '🛒 精選網購 (3.8%)', content: '蝦皮購物, momo購物網, PChome, Yahoo奇摩, Amazon, Coupang(酷澎), 博客來, Pinkoi, 露天拍賣, 淘寶, 東森購物, PayEasy', rate: '3.8%' }
    ]
  },
  { 
    id: 'sinopac_sport', 
    bank: 'SINOPAC 永豐銀行', 
    card: 'Sport 卡', 
    name: '運動通路加碼', 
    category: '運動', 
    totalRate: 7,
    baseRate: 1,
    bonusRate: 6,
    startDate: '2025-10-15', 
    endDate: '2025-12-20', 
    mainTag: 'Apple Watch',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/Sport_Card.png', 
    gradient: 'from-orange-600 to-red-600', 
    textColor: 'text-white',
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/sport-card.html',
    details: [
      { label: '基本回饋', value: '1% 豐點' },
      { label: '運動獎勵', value: '+2% (每月7000卡路里)' },
      { label: '支付加碼', value: '+4% (指定支付方式)' }
    ],
    channels: [
      { title: '🍎 指定行動支付', content: 'Apple Pay, Google Pay (適用全台支援感應支付之實體通路：百貨/量販/超商/餐廳/加油站/電影院/誠品/Uniqlo/Zara...)', rate: '7%' },
      { title: '🏋️ 健身/運動用品', content: '健身工廠, World Gym, Curves, Anytime Fitness, 享健身 | 運動用品: Nike, Adidas, Puma, UA, Decathlon, Skechers, 摩曼頓, ABC Mart', rate: '7%' },
      { title: '⚕️ 藥妝/有機商店', content: '大樹藥局, 丁丁藥局, 啄木鳥藥局, 棉花田, 聖德科斯, 佑全保健藥妝, 杏一醫療用品', rate: '7%' }
    ]
  }
];

const ALL_CATEGORIES = [...new Set(INITIAL_CAMPAIGNS.map(c => c.category))];

// --- 獨立元件：卡片視覺呈現 ---
const CardVisual = ({ image, gradient, textColor, cardName, bankName }) => {
  const [imageError, setImageError] = useState(false);

  return (
    // 調整：在手機上使用 w-32 h-20 (約128x80px) 且保有旋轉效果
    <div className="relative w-32 h-20 md:w-40 md:h-24 perspective-1000 z-0 flex-shrink-0 group-hover:z-20 mt-2 md:mt-0 self-end md:self-auto">
      {/* 嘗試載入真實圖片 */}
      {!imageError && image ? (
        <img 
            src={image} 
            alt={cardName} 
            className={`
                w-full h-full object-cover rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] 
                transition-all duration-700 ease-out
                transform rotate-6 md:rotate-6 md:-translate-y-2 md:translate-x-4
                group-hover:rotate-0 md:group-hover:rotate-12 group-hover:scale-105 md:group-hover:scale-110
            `}
            onError={() => setImageError(true)}
        />
      ) : (
        /* 圖片載入失敗時的 Fallback：數位擬態卡面 */
        <div className={`
            w-full h-full rounded-xl shadow-md
            transition-all duration-700 ease-out
            transform rotate-6 md:rotate-6 md:-translate-y-2 md:translate-x-4
            group-hover:scale-105 md:group-hover:rotate-12 md:group-hover:scale-110
            bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10
        `}>
             <div className={`text-[10px] uppercase tracking-widest opacity-80 ${textColor}`}>{bankName.split(' ')[0]}</div>
             <div className="flex justify-between items-end">
                <div className={`text-xs font-bold leading-tight ${textColor}`}>{cardName}</div>
                <CreditCard size={16} className={`opacity-50 ${textColor}`} />
             </div>
        </div>
      )}
      
      {/* Reflection/Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

const App = () => {
  const [registeredIds, setRegisteredIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const ALL_CARDS = BANK_HIERARCHY.flatMap(b => b.cards);
  const [selectedCards, setSelectedCards] = useState(ALL_CARDS); 
  const [selectedCategories, setSelectedCategories] = useState(ALL_CATEGORIES);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedFilterBanks, setExpandedFilterBanks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("2025/12/10"); 

  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleRefreshData = () => {
    setIsUpdating(true);
    setTimeout(() => {
        setIsUpdating(false);
        const now = new Date();
        setLastUpdated(`${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 1500);
  };

  useEffect(() => {
    const saved = localStorage.getItem('registeredCampaigns_v4');
    if (saved) {
      setRegisteredIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('registeredCampaigns_v4', JSON.stringify(registeredIds));
  }, [registeredIds]);

  const toggleRegistration = (e, id) => {
    e.stopPropagation();
    setRegisteredIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCardFilter = (cardName) => {
    setSelectedCards(prev => 
      prev.includes(cardName) ? prev.filter(c => c !== cardName) : [...prev, cardName]
    );
  };

  const toggleBankAllCards = (bank) => {
    const bankCards = bank.cards;
    const allSelected = bankCards.every(card => selectedCards.includes(card));
    if (allSelected) {
      setSelectedCards(prev => prev.filter(c => !bankCards.includes(c)));
    } else {
      const newSelected = [...selectedCards];
      bankCards.forEach(card => {
        if (!newSelected.includes(card)) newSelected.push(card);
      });
      setSelectedCards(newSelected);
    }
  };

  const toggleFilterBankExpand = (bankCode) => {
    setExpandedFilterBanks(prev => 
      prev.includes(bankCode) ? prev.filter(b => b !== bankCode) : [...prev, bankCode]
    );
  };

  const toggleFilterCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const selectAll = () => {
    setSelectedCards(ALL_CARDS);
    setSelectedCategories(ALL_CATEGORIES);
  };

  const clearAll = () => {
    setSelectedCards([]);
    setSelectedCategories([]);
  };

  const filteredCampaigns = useMemo(() => {
    return INITIAL_CAMPAIGNS.filter(c => 
      selectedCards.includes(c.card) && 
      selectedCategories.includes(c.category)
    );
  }, [selectedCards, selectedCategories]);

  const theme = {
    bg: isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f0f0f0]',
    text: isDarkMode ? 'text-white' : 'text-black',
    subText: isDarkMode ? 'text-neutral-400' : 'text-neutral-500',
    cardBg: isDarkMode ? 'bg-[#141414]' : 'bg-white',
    cardBorder: isDarkMode ? 'border-neutral-800' : 'border-neutral-300',
    accent: 'text-[#D4AF37]', 
    accentBg: 'bg-[#D4AF37]',
    accentBorder: 'border-[#D4AF37]',
    fontDisplay: 'font-serif', 
    fontBody: 'font-sans',     
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 selection:bg-[#D4AF37] selection:text-black ${theme.bg} ${theme.text} ${theme.fontBody}`}>
      
      {/* --- FILTER MODAL --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl relative ${theme.cardBg} ${theme.cardBorder} border`}>
            
            <div className={`p-6 border-b ${theme.cardBorder} flex justify-between items-center shrink-0`}>
                <h3 className={`text-2xl font-serif italic ${theme.text}`}>Filter Selections</h3>
                <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
                >
                <X size={24} className={theme.subText} />
                </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme.accent} flex items-center gap-2`}>
                    <Star size={12} fill="currentColor"/> Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleFilterCategory(cat)}
                      className={`px-3 py-2 text-xs border transition-all duration-200
                        ${selectedCategories.includes(cat) 
                          ? `${theme.accentBg} text-black border-[#D4AF37]` 
                          : `bg-transparent ${theme.subText} ${theme.cardBorder}`
                        }
                      `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme.accent} flex items-center gap-2`}>
                    <Filter size={12} /> Banks & Cards
                </h4>
                <div className="space-y-3">
                  {BANK_HIERARCHY.map(bank => {
                    const isExpanded = expandedFilterBanks.includes(bank.code);
                    const selectedCount = bank.cards.filter(c => selectedCards.includes(c)).length;
                    const isFull = selectedCount === bank.cards.length;
                    const isPartial = selectedCount > 0 && !isFull;

                    return (
                        <div key={bank.code} className={`border ${theme.cardBorder} rounded-lg overflow-hidden transition-all duration-300`}>
                            <div 
                                className={`flex items-center justify-between p-3 cursor-pointer ${isExpanded ? (isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100') : 'bg-transparent'}`}
                                onClick={() => toggleFilterBankExpand(bank.code)}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleBankAllCards(bank);
                                        }}
                                        className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                                            isFull ? `${theme.accentBg} border-[#D4AF37]` : 
                                            isPartial ? `${theme.accentBg} border-[#D4AF37] opacity-60` : 
                                            `border-neutral-500 bg-transparent`
                                        }`}
                                    >
                                        {isFull && <Check size={14} className="text-black" strokeWidth={3} />}
                                        {isPartial && <div className="w-2 h-2 bg-black"></div>}
                                    </button>
                                    <span className={`text-sm font-bold tracking-wide ${theme.text}`}>{bank.name}</span>
                                </div>
                                <ChevronRight size={16} className={`transition-transform duration-300 ${theme.subText} ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>

                            <div className={`
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${isExpanded ? 'max-h-[500px] opacity-100 border-t ' + theme.cardBorder : 'max-h-0 opacity-0'}
                            `}>
                                <div className="p-3 grid grid-cols-2 gap-2 bg-opacity-50">
                                    {bank.cards.map(cardName => (
                                        <button
                                            key={cardName}
                                            onClick={() => toggleCardFilter(cardName)}
                                            className={`
                                                text-left px-3 py-2 text-xs border transition-all flex justify-between items-center
                                                ${selectedCards.includes(cardName)
                                                    ? `${theme.text} ${theme.accentBorder} bg-neutral-800/50`
                                                    : `${theme.subText} border-transparent hover:bg-neutral-800/30`
                                                }
                                            `}
                                        >
                                            {cardName}
                                            {selectedCards.includes(cardName) && <Check size={12} className={theme.accent} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`p-6 border-t ${theme.cardBorder} flex gap-4 shrink-0 bg-opacity-90 backdrop-blur-xl rounded-b-2xl`}>
               <button onClick={selectAll} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text}`}>Select All</button>
               <button onClick={clearAll} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text}`}>Clear</button>
               <button 
                 onClick={() => setIsFilterOpen(false)}
                 className={`ml-auto px-8 py-3 ${theme.accentBg} text-black text-sm font-bold uppercase tracking-wider hover:opacity-90 shadow-lg shadow-amber-500/20`}
               >
                 Apply Filter
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER (Sticky) --- */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-opacity-90 transition-all border-b border-neutral-800/50 pt-4 pb-4 md:pt-12 md:pb-8 ${theme.bg}`}>
        <div className="w-full px-4 md:px-12">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className={`text-3xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] ${theme.text}`}>
                Reward
                <span className={`block font-serif italic font-light tracking-normal text-2xl md:text-5xl mt-1 ${theme.accent}`}>
                  Engine.
                </span>
              </h1>
            </div>
            
            <div className="flex flex-col items-end gap-2 md:gap-4">
               {/* 模擬更新按鈕 */}
               <div className="flex items-center gap-2 md:gap-3">
                   <div className="hidden md:flex flex-col items-end mr-2">
                       <span className={`text-[10px] uppercase tracking-wider ${theme.subText}`}>Last Updated</span>
                       <span className={`text-[10px] font-mono ${theme.accent}`}>{lastUpdated}</span>
                   </div>
                   <button 
                    onClick={handleRefreshData}
                    disabled={isUpdating}
                    className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border ${theme.cardBorder} hover:border-[#D4AF37] transition-all ${isUpdating ? 'animate-spin opacity-50' : ''}`}
                    title="Sync Latest Data"
                   >
                    <RefreshCw size={14} className="md:w-4 md:h-4" />
                   </button>
                   <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border ${theme.cardBorder} hover:scale-110 transition-transform`}
                   >
                    {isDarkMode ? <Sun size={16} strokeWidth={1.5} className="md:w-[18px]" /> : <Moon size={16} strokeWidth={1.5} className="md:w-[18px]" />}
                   </button>
               </div>
               
              <div className="hidden md:block text-right">
                <div className={`text-xs uppercase tracking-widest ${theme.subText}`}>Active</div>
                <div className={`text-xl font-serif italic ${theme.text}`}>{filteredCampaigns.length < 10 ? `0${filteredCampaigns.length}` : filteredCampaigns.length}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-8 flex items-center justify-between border-t border-b border-neutral-800 py-3">
             <div className="flex gap-4 md:gap-6 text-xs font-bold tracking-widest uppercase">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`transition-colors ${viewMode === 'list' ? theme.accent : theme.subText}`}
                >
                    Index
                </button>
                <button 
                    onClick={() => setViewMode('compare')}
                    className={`transition-colors ${viewMode === 'compare' ? theme.accent : theme.subText}`}
                >
                    Rankings
                </button>
             </div>
             
             <button 
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase ${theme.subText} hover:${theme.accent} transition-colors px-2 py-1 md:px-3 md:py-1 border border-transparent hover:border-neutral-700`}
             >
                <Filter size={12} />
                Filter View
             </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="w-full px-4 md:px-12 py-8 md:py-12">
        
        {viewMode === 'list' && (
          <div className="grid gap-8 md:gap-12">
            {filteredCampaigns.map((campaign, index) => {
              const isRegistered = registeredIds.includes(campaign.id);
              const isExpanded = expandedId === campaign.id;

              return (
                <article 
                  key={campaign.id}
                  onClick={() => toggleExpand(campaign.id)}
                  className={`
                    group relative cursor-pointer transition-all duration-500
                    ${isRegistered ? '' : 'hover:-translate-y-1'}
                  `}
                >
                  {/* Number */}
                  <div className={`absolute -left-2 md:-left-4 -top-6 md:-top-8 text-[60px] md:text-[120px] font-black leading-none opacity-5 select-none font-serif ${theme.text}`}>
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </div>

                  {/* Registered Badge */}
                  {isRegistered && (
                    <div className={`absolute right-0 -top-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${theme.accentBg} text-black px-3 py-1 z-10 shadow-lg`}>
                        <Check size={12} strokeWidth={3} />
                        Registered
                    </div>
                  )}

                  {/* Card Body */}
                  <div className={`relative border-t-2 ${isRegistered ? theme.accentBorder : (theme.text === 'text-white' ? 'border-white' : 'border-black')} pt-4 transition-colors duration-500`}>
                    
                    {/* Header Layout: Mobile Friendly */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6">
                      
                      {/* Left: Checkbox & Info */}
                      <div className="flex gap-4 md:gap-6 z-10">
                        <button 
                          onClick={(e) => toggleRegistration(e, campaign.id)}
                          className={`
                            relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 border transition-all duration-300 flex items-center justify-center
                            ${isRegistered 
                              ? `${theme.accentBg} border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]` 
                              : `bg-transparent ${theme.cardBorder} hover:border-[#D4AF37]`}
                          `}
                        >
                          {isRegistered && <Check size={20} strokeWidth={3} className="md:w-6 md:h-6" />}
                          <span className="absolute -bottom-5 left-0 text-[8px] md:text-[9px] uppercase tracking-widest w-full text-center opacity-50">
                            {isRegistered ? 'Done' : 'Log'}
                          </span>
                        </button>

                        <div className="flex-1">
                          <h3 className={`text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-1 md:mb-2 ${theme.accent}`}>
                            {campaign.bank}
                          </h3>
                          
                          <div className="group/link flex items-center gap-2">
                            <a 
                                href={campaign.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} 
                                className={`
                                    text-2xl md:text-4xl font-serif italic leading-tight mb-2 hover:underline hover:decoration-2 hover:decoration-[#D4AF37] transition-all
                                    ${theme.text}
                                `}
                            >
                                {campaign.card}
                            </a>
                            <ExternalLink size={14} className={`opacity-0 group-hover/link:opacity-100 transition-opacity mb-2 ${theme.accent}`} />
                          </div>
                          
                          <div className={`flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs uppercase tracking-wider font-bold ${theme.subText}`}>
                            <span className="border border-neutral-700 px-2 py-1">{campaign.mainTag}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {campaign.startDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Rate Display & Card Image */}
                      <div className="flex flex-row-reverse justify-between md:flex-col md:items-end gap-4 md:gap-6 relative">
                        {/* Rate */}
                        <div className="text-right flex flex-col items-end z-10">
                            <div className="flex items-baseline gap-1 font-mono text-xs md:text-sm md:text-base opacity-70 mb-1">
                                <span>{campaign.baseRate}%</span>
                                <span className="text-[10px] md:text-xs mx-1 text-neutral-500">BASE</span>
                                <Plus size={10} />
                                <span>{campaign.bonusRate}%</span>
                                <span className="text-[10px] md:text-xs mx-1 text-[#D4AF37]">BONUS</span>
                            </div>
                            <div className={`text-4xl md:text-6xl font-black tracking-tighter flex items-start ${theme.text}`}>
                            {campaign.totalRate}
                            <span className="text-xl md:text-2xl mt-1 ml-1 font-light">%</span>
                            </div>
                            <div className={`mt-1 md:mt-2 text-[8px] md:text-[10px] uppercase tracking-[0.3em] ${theme.subText}`}>
                            Total Reward
                            </div>
                        </div>

                        {/* Card Image (Now visible on mobile) */}
                        <CardVisual 
                            image={campaign.image} 
                            gradient={campaign.gradient}
                            textColor={campaign.textColor}
                            cardName={campaign.card}
                            bankName={campaign.bank}
                        />
                      </div>
                    </div>

                    {/* EXPANDABLE DETAILS */}
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        <div className={`pt-4 md:pt-8 pb-4 border-t border-dashed ${theme.cardBorder}`}>
                            
                            {/* --- 重要注意事項區塊 --- */}
                            {campaign.importantNotesList && campaign.importantNotesList.map((note, index) => {
                                const noteId = `${campaign.id}_note_${index}`;
                                const isNoteRegistered = registeredIds.includes(noteId);
                                
                                return (
                                <div 
                                    key={index} 
                                    className={`
                                        mb-6 p-4 md:p-6 border-l-4 transition-all duration-300 relative overflow-hidden group/note
                                        ${isNoteRegistered 
                                            ? `border-[#D4AF37] ${isDarkMode ? 'bg-amber-900/10' : 'bg-amber-50'} shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]` 
                                            : `border-neutral-500/30 ${isDarkMode ? 'bg-neutral-900/30' : 'bg-neutral-50'} hover:border-[#D4AF37]/50`
                                        }
                                    `}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <AlertTriangle size={64} className={theme.text} />
                                    </div>

                                    {/* Header Row with Checkbox */}
                                    <div className="flex items-start gap-4 mb-3 relative z-10">
                                        {/* Sub-Checkbox */}
                                        <button 
                                            onClick={(e) => toggleRegistration(e, noteId)}
                                            className={`
                                                w-6 h-6 md:w-8 md:h-8 flex-shrink-0 border flex items-center justify-center transition-all duration-300
                                                ${isNoteRegistered 
                                                    ? `${theme.accentBg} border-[#D4AF37] text-black shadow-md` 
                                                    : `bg-transparent ${theme.cardBorder} hover:border-[#D4AF37]`
                                                }
                                            `}
                                        >
                                            {isNoteRegistered && <Check size={14} strokeWidth={3} className="md:w-4 md:h-4" />}
                                        </button>

                                        <div>
                                            <h4 className={`text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme.accent}`}>
                                                <AlertTriangle size={14} /> Important Notice {index + 1}
                                                {isNoteRegistered && <span className="ml-2 text-[8px] md:text-[10px] bg-[#D4AF37] text-black px-1.5 py-0.5 rounded-sm">COMPLETED</span>}
                                            </h4>
                                            <h5 className={`text-sm md:text-lg font-bold mt-1 ${isNoteRegistered ? 'opacity-50 line-through decoration-2 decoration-[#D4AF37]' : theme.text}`}>
                                                {note.title}
                                            </h5>
                                        </div>
                                    </div>
                                    
                                    <p className={`mb-6 text-xs md:text-sm font-medium leading-relaxed pl-10 md:pl-12 ${isDarkMode ? 'text-white' : 'text-amber-900'} ${isNoteRegistered ? 'opacity-50' : ''}`}>
                                        {note.highlight}
                                    </p>

                                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 pl-10 md:pl-12 ${isNoteRegistered ? 'opacity-50 grayscale' : ''}`}>
                                        {note.schedule.map((item, i) => (
                                            <div key={i} className={`p-3 md:p-4 border ${isDarkMode ? 'border-neutral-700 bg-neutral-950' : 'border-amber-200 bg-white'}`}>
                                                <div className={`text-[10px] md:text-xs font-bold uppercase mb-1 md:mb-2 ${theme.subText}`}>{item.month}</div>
                                                <div className={`text-xs md:text-sm font-mono font-bold mb-1 ${theme.text}`}>{item.time}</div>
                                                <div className={`text-[10px] md:text-xs ${theme.accent}`}>{item.limit}</div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <p className={`text-[10px] md:text-xs mt-2 opacity-70 pl-10 md:pl-12 ${theme.subText}`}>
                                        {note.footer}
                                    </p>
                                </div>
                            )})}

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                <div className="md:col-span-4 space-y-4">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 border-l-2 pl-3 ${theme.text} border-[#D4AF37]`}>
                                        Reward Structure
                                    </h4>
                                    <ul className="space-y-3">
                                        {campaign.details.map((detail, idx) => (
                                            <li key={idx} className="flex justify-between items-baseline text-xs md:text-sm group">
                                                <span className={`${theme.subText} group-hover:${theme.text} transition-colors`}>{detail.label}</span>
                                                <span className={`font-mono font-bold ${theme.text}`}>{detail.value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="md:col-span-8">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 border-l-2 pl-3 ${theme.text} border-[#D4AF37]`}>
                                        Applicable Channels
                                    </h4>
                                    <div className="grid gap-3">
                                        {campaign.channels.map((channel, cIdx) => (
                                            <div key={cIdx} className={`p-4 md:p-5 ${isDarkMode ? 'bg-neutral-900/50' : 'bg-neutral-100'} border ${theme.cardBorder} hover:border-[#D4AF37] transition-colors`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className={`font-bold ${theme.text} text-xs md:text-sm flex items-center gap-2`}>
                                                        {channel.title}
                                                    </span>
                                                    <span className={`font-black text-lg md:text-xl italic ${theme.accent}`}>{channel.rate}</span>
                                                </div>
                                                <p className={`text-xs leading-6 ${theme.subText} text-justify`}>
                                                    {channel.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`mt-4 text-[10px] italic ${theme.subText}`}>
                                        * 點擊標題可查看銀行完整條款，實際回饋以官方公告為準。
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-center mt-2">
                        {isExpanded ? <ChevronUp size={20} className={theme.subText}/> : <ChevronDown size={20} className={theme.subText} />}
                    </div>
                  </div>
                </article>
              );
            })}
            
            {filteredCampaigns.length === 0 && (
                <div className={`py-20 text-center ${theme.subText}`}>
                    <p className="text-xl font-serif italic mb-2">No matches found.</p>
                    <button onClick={selectAll} className={`text-xs uppercase border-b border-dashed ${theme.cardBorder}`}>Clear Filter</button>
                </div>
            )}
          </div>
        )}

        {/* --- RANKINGS VIEW --- */}
        {viewMode === 'compare' && (
             <div className="space-y-16">
                <div className="text-center space-y-2 mb-12">
                    <h2 className={`text-3xl font-serif italic ${theme.text}`}>Top Selections</h2>
                    <div className={`w-12 h-1 bg-[#D4AF37] mx-auto`}></div>
                </div>

                {['旅遊', '網購', '一般消費'].map((cat) => {
                    const topCards = INITIAL_CAMPAIGNS.filter(c => c.category === cat).sort((a,b) => b.totalRate - a.totalRate);
                    if (topCards.length === 0) return null;
                    const winner = topCards[0];

                    return (
                        <div key={cat} className="grid md:grid-cols-2 gap-8 items-center border-b border-neutral-800 pb-12">
                             <div className="order-2 md:order-1">
                                <div className={`text-[10px] uppercase tracking-[0.3em] mb-2 ${theme.accent}`}>Category Winner</div>
                                <h3 className={`text-4xl font-black uppercase mb-1 ${theme.text}`}>{cat}</h3>
                                <div className={`text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-700 mb-6`}>
                                    {winner.totalRate}%
                                </div>
                                <div className="space-y-2">
                                    <a 
                                      href={winner.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-xl font-bold ${theme.text} hover:underline hover:decoration-[#D4AF37] flex items-center gap-2 w-fit`}
                                    >
                                        {winner.card}
                                        <ExternalLink size={14} className={theme.subText} />
                                    </a>
                                    <div className={`text-sm ${theme.subText}`}>{winner.bank}</div>
                                    <div className={`mt-4 p-3 border-l-2 border-[#D4AF37] ${isDarkMode ? 'bg-neutral-900/50' : 'bg-neutral-100'}`}>
                                        <div className="text-xs font-bold uppercase mb-1">Winning Factor</div>
                                        <div className={`text-sm ${theme.text}`}>{winner.details[1]?.value || winner.name}</div>
                                    </div>
                                </div>
                             </div>

                             {/* 如果有圖片則顯示卡片，否則顯示抽象圖 */}
                             <div className={`order-1 md:order-2 h-64 md:h-full min-h-[250px] relative overflow-hidden flex items-center justify-center border ${theme.cardBorder} p-6`}>
                                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>
                                 
                                 {/* 使用 CardVisual 來確保這裡也能正確顯示 fallback */}
                                 <div className="scale-125 transform">
                                    <CardVisual 
                                        image={winner.image} 
                                        gradient={winner.gradient}
                                        textColor={winner.textColor}
                                        cardName={winner.card}
                                        bankName={winner.bank}
                                    />
                                 </div>
                             </div>
                        </div>
                    )
                })}
             </div>
        )}

      </main>

      <footer className={`py-12 border-t border-neutral-800 ${theme.bg}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
             <h2 className={`text-2xl font-black italic tracking-tighter mb-6 opacity-30 ${theme.text}`}>REWARD ENGINE</h2>
             <div className={`flex justify-center gap-8 text-[10px] uppercase tracking-widest ${theme.subText}`}>
                <span>Privacy</span>
                <span>Terms</span>
                <a href="https://www.threads.com/@w.tzuyin" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">Contact</a>
             </div>
             <div className={`mt-8 text-[10px] ${theme.subText} opacity-50`}>
                &copy; 2025 DESIGNED BY SARAH. ALL RIGHTS RESERVED.
             </div>
        </div>
      </footer>
    </div>
  );
};

export default App;


