import React, { useState, useEffect, useMemo } from 'react';
import { Check, Calendar, ArrowUpRight, Clock, Sun, Moon, Gift, Plus, ChevronDown, ChevronUp, Star, Zap, ShoppingBag, Plane, Coffee, ExternalLink, Filter, X, AlertTriangle, ChevronRight, Globe, Utensils, Music, Gamepad, GraduationCap, Cat, Home, CreditCard, RefreshCw, Search, Palette, Heart } from 'lucide-react';

// --- 銀行與卡別層級資料庫 ---
const BANK_HIERARCHY = [
  { name: 'CTBC 中國信託', code: 'CTBC', cards: ['All Me 卡', 'LINE Pay 卡'] },
  { name: 'CATHAY 國泰世華', code: 'CATHAY', cards: ['CUBE 卡'] },
  { name: 'FUBON 台北富邦', code: 'FUBON', cards: ['J 卡', 'Open Possible 卡'] },
  { name: 'TAISHIN 台新銀行', code: 'TAISHIN', cards: ['@GoGo 卡', '玫瑰卡', 'Richart 卡'] },
  { name: 'E.SUN 玉山銀行', code: 'ESUN', cards: ['U Bear 卡'] },
  { name: 'SINOPAC 永豐銀行', code: 'SINOPAC', cards: ['Sport 卡', '大戶 DAWHO 現金回饋卡', '現金回饋 JCB 卡'] },
  { name: 'FEDERAL 聯邦銀行', code: 'FEDERAL', cards: ['吉鶴卡'] }
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
    baseRate: 1, 
    bonusRate: 9, 
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '日韓旅遊',
    image: 'https://www.fubon.com/banking/images/credit_card/J_Card_omiyage_card_1.png', 
    gradient: 'from-rose-50 via-white to-rose-100', 
    textColor: 'text-rose-900',
    link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/omiyage/omiyage.htm',
    details: [
      { label: '國內一般消費', value: '1% LINE POINTS (無上限)' }, 
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
    id: 'fubon_op',
    bank: 'FUBON 台北富邦',
    card: 'Open Possible 卡',
    name: '電信/餐飲生活',
    category: '生活',
    totalRate: 10, 
    baseRate: 2,
    bonusRate: 8,
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    mainTag: '電信 3.5%',
    image: 'https://www.fubon.com/banking/images/credit_card/OpenPossible_card_1.png',
    gradient: 'from-violet-900 to-black', 
    textColor: 'text-white',
    link: 'https://www.fubon.com/banking/Personal/credit_card/all_card/OpenPossible/OpenPossible.htm',
    details: [
        { label: '一般消費', value: '1% 無上限' },
        { label: '台灣大 5G 電信費', value: '3.5% 現金回饋' },
        { label: '指定生活/餐飲', value: '最高 10% (需 icash 2.0)' }
    ],
    importantNotesList: [
        {
            title: '新戶首刷好禮',
            highlight: '※ 新戶核卡後 30 天內刷滿 5 筆或累積 5,000 元，享 300 元刷卡金。',
            schedule: [
                { month: '常態', time: '核卡後 30 天內', limit: '新戶專屬' }
            ],
            footer: '完成指定任務 (Fubon+ App / 自動扣繳) 再加贈 100 元。'
        }
    ],
    channels: [
        { title: '📱 電信費 (3.5%)', content: '台灣大哥大 5G 電信費 (需代扣繳) 享 3.5%；4G 電信費、家用寬頻、momo 隨帳收享 2%。', rate: '3.5%' },
        { title: '🏪 生活消費 (2%)', content: '全台 7-ELEVEN、全家便利商店、中港澳地區消費、加油站 (中油/台塑/全國)。', rate: '2%' },
        { title: '🍔 指定餐飲 (10%)', content: '使用 icash 2.0 功能支付：麥當勞、漢堡王、達美樂、必勝客、肯德基、星巴克 (需 icash Pay 帳戶)。', rate: '10%' }
    ]
  },
  {
    id: 'taishin_rose',
    bank: 'TAISHIN 台新銀行',
    card: '玫瑰卡',
    name: '權益切換刷',
    category: '一般消費',
    totalRate: 3.8,
    baseRate: 0.3,
    bonusRate: 3.5,
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    mainTag: '切換 3.8%',
    image: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010102/TS020101010202/images/card_02.png',
    gradient: 'from-rose-400 via-rose-300 to-pink-200', 
    textColor: 'text-rose-900',
    link: 'https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/cg013/card0001/',
    details: [
        { label: '一般消費', value: '0.3% 台新 Point' },
        { label: '指定權益切換', value: '3.8% (天天/大筆/好饗)' },
        { label: '海外消費', value: '3.8% (日韓歐美免切換)' }
    ],
    channels: [
        { title: '🔄 權益切換 (3.8%)', content: '每日可於 Richart Life App 切換權益：「天天刷」(超商/量販/加油)、「大筆刷」(百貨/網購/訂房)、「好饗刷」(餐飲/外送)。', rate: '3.8%' },
        { title: '🏪 天天刷 (3.8%)', content: '全家, 7-11 (限台新Pay), 家樂福, 中油, 台亞, 台灣大車隊, Uber。', rate: '3.8%' },
        { title: '🛍️ 大筆刷 (3.8%)', content: '新光三越, SOGO, 遠東百貨, momo, 蝦皮, PChome, 淘寶, 昇恆昌。', rate: '3.8%' },
        { title: '🍽️ 好饗刷 (3.8%)', content: '全台餐廳, 外送平台 (UberEats/Foodpanda), 星巴克, 路易莎, 錢櫃, 好樂迪。', rate: '3.8%' }
    ]
  },
  {
    id: 'taishin_richart',
    bank: 'TAISHIN 台新銀行',
    card: 'Richart 卡',
    name: '數位生活整合',
    category: '網購',
    totalRate: 3.8,
    baseRate: 0.3,
    bonusRate: 3.5,
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    mainTag: '數位 3.8%',
    image: 'https://www.taishinbank.com.tw/TS/TS02/TS0201/TS020101/TS02010101/TS0201010104/TS020101010409/images/card_01.png', 
    gradient: 'from-gray-50 to-white', 
    textColor: 'text-gray-800',
    link: 'https://mkp.taishinbank.com.tw/s/2025/RichartCard_2025/index.html',
    details: [
        { label: '一般消費', value: '0.3% 台新 Point' },
        { label: '數位/網購', value: '3.8% (需綁定 Richart 帳戶)' },
        { label: '保費', value: '1.3% (免切換)' }
    ],
    importantNotesList: [
        {
            title: 'Richart 帳戶扣繳任務',
            highlight: '※ 需使用 Richart 數位帳戶自動扣繳信用卡費，始享 3.8% 高回饋。',
            schedule: [
                { month: '每月', time: '帳單結帳前設定', limit: '必要條件' }
            ],
            footer: '未設定自動扣繳僅享 0.3% 回饋。'
        }
    ],
    channels: [
        { title: '🛒 精選網購 (3.8%)', content: '蝦皮購物, momo, PChome, Yahoo, Amazon, Coupang, 博客來。', rate: '3.8%' },
        { title: '📱 行動支付 (3.8%)', content: 'LINE Pay, 全支付, 台新Pay, 全盈+PAY (適用超商/百貨/餐飲等)。', rate: '3.8%' },
        { title: '📄 保費回饋 (1.3%)', content: '繳納保費享 1.3% 回饋無上限，且可分期 0 利率 (需登錄)。', rate: '1.3%' }
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
        { label: '國內一般消費', value: '1% LINE POINTS (無上限)' },
        { label: '國外實體消費', value: '2.8% LINE POINTS (無上限)' },
        { label: '指定通路加碼', value: '最高 15% (如 Hotels.com)' }
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
    gradient: 'from-blue-600 to-cyan-500', 
    textColor: 'text-white',
    link: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/ALLME/index.html',
    details: [
        { label: '一般消費', value: '1% 中信點' },
        { label: '指定通路加碼', value: '8% (需綁定 Hami Pay/Pi 錢包)' }
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
    gradient: 'from-zinc-900 via-black to-zinc-900', 
    textColor: 'text-yellow-400', 
    link: 'https://event.esunbank.com.tw/credit/ubear/index.html',
    details: [
        { label: '國內外一般消費', value: '1% 現金回饋' },
        { label: '指定網路消費', value: '3% (含行動支付)' },
        { label: '指定影音平台', value: '13% (上限100元)' }
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
    baseRate: 1, 
    bonusRate: 3, 
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    mainTag: '日本 4%',
    image: 'https://card.ubot.com.tw/eCard/assets/images/creditcard/JIHO/card_01.png',
    gradient: 'from-red-600 to-rose-700', 
    textColor: 'text-white',
    link: 'https://card.ubot.com.tw/eCard/activity/2025JIHO/index.htm',
    details: [
        { label: '國內一般消費', value: '1% 無上限' },
        { label: '日幣消費', value: '2.5% 無上限' },
        { label: '日本QUICPay', value: '+1.5% (綁定 Apple Pay)' }
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
    baseRate: 1, 
    bonusRate: 6, 
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '國內外 7%',
    image: 'https://dawho.tw/assets/images/card/credit-card-black.png',
    gradient: 'from-black to-zinc-900', 
    textColor: 'text-yellow-500', 
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html',
    details: [
      { label: '國內一般消費', value: '1% 現金回饋' },
      { label: '國外一般消費', value: '2% 現金回饋' },
      { label: '指定任務加碼', value: '+1% (需綁定大戶自動扣繳)' },
      { label: '七大通路加碼', value: '+5% (上限300元/月)' }
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
    baseRate: 1, 
    bonusRate: 4, 
    startDate: '2025-10-01', 
    endDate: '2025-12-31', 
    mainTag: '網購/百貨/餐飲',
    image: 'https://bank.sinopac.com/upload/sinopac/creditcard/JCB_Card.png', 
    gradient: 'from-violet-800 to-purple-900', 
    textColor: 'text-white',
    link: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/cashcardJCB.html',
    details: [
      { label: '國內一般消費', value: '1% 現金回饋' },
      { label: '特選通路加碼', value: '+3% (當期帳單滿3000)' },
      { label: '網購/百貨加碼', value: '最高 5% (上限300元/月)' }
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
    gradient: 'from-gray-200 to-gray-400', 
    textColor: 'text-gray-800',
    link: 'https://www.cathaybk.com.tw/cathaybk/personal/product/credit-card/cards/cube/',
    details: [
      { label: '一般消費', value: '0.3% 小樹點' },
      { label: '指定權益加碼', value: '3% (每日可切換一次)' },
      { label: '日本賞加碼', value: '3.5% (期間限定)' }
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
      { label: '一般消費', value: '0.5% 現金回饋' },
      { label: '精選通路加碼', value: '+3.3% (需電子帳單+Richart扣繳)' }
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
      { label: '一般消費', value: '1% 豐點' },
      { label: '運動獎勵加碼', value: '+2% (每月7000卡路里)' },
      { label: '指定支付加碼', value: '+4% (指定支付方式)' }
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
const CardVisual = ({ image, gradient, textColor, cardName, bankName, uiStyle }) => {
  const [imageError, setImageError] = useState(false);

  return (
    // 調整：手機版尺寸 w-36 h-24 (144px x 96px, 1.5:1 ratio) 且保有旋轉效果
    <div className={`relative w-36 h-24 md:w-44 md:h-28 perspective-1000 z-0 flex-shrink-0 group-hover:z-20 mt-1 md:mt-0 self-end md:self-auto ${uiStyle === 'korean' ? 'perspective-none' : ''}`}>
      {!imageError && image ? (
        <img 
            src={image} 
            alt={cardName} 
            className={`
                w-full h-full object-cover shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] 
                transition-all duration-700 ease-out
                ${uiStyle === 'korean' 
                  ? 'rounded-3xl rotate-0 scale-95 group-hover:scale-105 group-hover:-translate-y-2' 
                  : 'rounded-xl transform rotate-6 md:rotate-6 md:-translate-y-2 md:translate-x-4 group-active:rotate-0 md:group-hover:rotate-12 group-active:scale-105 md:group-hover:scale-110'
                }
            `}
            onError={() => setImageError(true)}
        />
      ) : (
        <div className={`
            w-full h-full shadow-md
            transition-all duration-700 ease-out
            bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between border border-white/10
            ${uiStyle === 'korean'
                ? 'rounded-3xl rotate-0 scale-95 group-hover:scale-105 group-hover:-translate-y-2' 
                : 'rounded-xl transform rotate-6 md:rotate-6 md:-translate-y-2 md:translate-x-4 group-active:rotate-0 md:group-hover:rotate-12 group-active:scale-105 md:group-hover:scale-110'
            }
        `}>
             <div className={`text-[10px] uppercase tracking-widest opacity-80 italic ${textColor} font-serif`}>{bankName.split(' ')[0]}</div>
             <div className="flex justify-between items-end">
                <div className={`text-xs font-bold leading-tight italic ${textColor} font-serif mt-0.5`}>{cardName}</div>
                <CreditCard size={16} className={`opacity-50 ${textColor}`} />
             </div>
        </div>
      )}
      
      {/* Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none mix-blend-overlay ${uiStyle === 'korean' ? 'rounded-3xl' : 'rounded-xl'}`}></div>
    </div>
  );
};

const App = () => {
  const [registeredIds, setRegisteredIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [uiStyle, setUiStyle] = useState('nyc'); 
  const [searchQuery, setSearchQuery] = useState('');
  
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
    let themeColor = '#ffffff'; 
    if (isDarkMode) {
        themeColor = uiStyle === 'nyc' ? '#09090b' : '#2D2D3A'; 
    } else {
        themeColor = uiStyle === 'nyc' ? '#f0f0f0' : '#FDFBF7'; 
    }
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
    document.body.style.backgroundColor = themeColor;
  }, [isDarkMode, uiStyle]);

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
    return INITIAL_CAMPAIGNS.filter(c => {
      const matchesFilter = selectedCards.includes(c.card) && selectedCategories.includes(c.category);
      if (!matchesFilter) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const inCardName = c.card.toLowerCase().includes(query);
        const inBankName = c.bank.toLowerCase().includes(query);
        const inChannels = c.channels.some(ch => 
            ch.title.toLowerCase().includes(query) || 
            ch.content.toLowerCase().includes(query)
        );
        return inCardName || inBankName || inChannels;
      }
      return true;
    });
  }, [selectedCards, selectedCategories, searchQuery]);

  const getTheme = () => {
    if (uiStyle === 'nyc') {
        return {
            bg: isDarkMode ? 'bg-[#09090b]' : 'bg-[#f0f0f0]',
            text: isDarkMode ? 'text-white' : 'text-black',
            subText: isDarkMode ? 'text-neutral-400' : 'text-neutral-500',
            cardBg: isDarkMode ? 'bg-[#141414]' : 'bg-white',
            cardBorder: isDarkMode ? 'border-neutral-800' : 'border-neutral-300',
            accent: 'text-[#D4AF37]', 
            accentBg: 'bg-[#D4AF37]',
            accentBorder: 'border-[#D4AF37]',
            fontDisplay: "font-['Playfair_Display']", 
            fontBody: 'font-sans',
            rounded: 'rounded-none',
            buttonShape: 'rounded-full',
            shadow: 'shadow-none'
        };
    } else {
        return {
            bg: isDarkMode ? 'bg-[#2D2D3A]' : 'bg-[#FDFBF7]', 
            text: isDarkMode ? 'text-slate-100' : 'text-slate-700',
            subText: isDarkMode ? 'text-slate-400' : 'text-slate-400',
            cardBg: isDarkMode ? 'bg-[#3A3A4A]' : 'bg-white',
            cardBorder: 'border-transparent', 
            accent: isDarkMode ? 'text-violet-400' : 'text-rose-400', 
            accentBg: isDarkMode ? 'bg-violet-400' : 'bg-rose-300',
            accentBorder: isDarkMode ? 'border-violet-400' : 'border-rose-300',
            fontDisplay: "font-['DynaPuff']", 
            fontBody: 'font-sans',
            rounded: 'rounded-3xl', 
            buttonShape: 'rounded-2xl',
            shadow: isDarkMode ? 'shadow-lg shadow-black/20' : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        };
    }
  };

  const theme = getTheme();

  return (
    // 使用 max-w-md 限制寬度，mx-auto 讓它在桌面置中，模仿手機 App 介面
    <div className={`min-h-screen w-full transition-colors duration-500 selection:bg-rose-200 selection:text-rose-900 ${theme.bg} ${theme.text} ${theme.fontBody} flex justify-center`}>
      <div className={`w-full max-w-md ${theme.bg} min-h-screen flex flex-col shadow-2xl relative`}>
      
      {/* FILTER MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm max-h-[85vh] flex flex-col ${theme.rounded === 'rounded-none' ? 'rounded-2xl' : 'rounded-[2rem]'} shadow-2xl relative ${theme.cardBg} ${theme.cardBorder} border`}>
            <div className={`p-6 border-b ${theme.cardBorder} flex justify-between items-center shrink-0`}>
                <h3 className={`text-2xl ${theme.fontDisplay} italic ${theme.text}`}>Filter Selections</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-black/5 transition-colors">
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
                      className={`px-3 py-2 text-xs border transition-all duration-200 ${theme.buttonShape}
                        ${selectedCategories.includes(cat) 
                          ? `${theme.accentBg} ${isDarkMode ? 'text-white' : 'text-white'} border-transparent` 
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
                        <div key={bank.code} className={`border ${theme.cardBorder} ${theme.buttonShape} overflow-hidden transition-all duration-300`}>
                            <div 
                                className={`flex items-center justify-between p-3 cursor-pointer ${isExpanded ? 'bg-black/5' : 'bg-transparent'}`}
                                onClick={() => toggleFilterBankExpand(bank.code)}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleBankAllCards(bank);
                                        }}
                                        className={`w-5 h-5 border flex items-center justify-center transition-colors rounded-md ${
                                            isFull ? `${theme.accentBg} border-transparent` : 
                                            isPartial ? `${theme.accentBg} border-transparent opacity-60` : 
                                            `border-neutral-400 bg-transparent`
                                        }`}
                                    >
                                        {isFull && <Check size={14} className="text-white" strokeWidth={3} />}
                                        {isPartial && <div className="w-2 h-2 bg-white"></div>}
                                    </button>
                                    <span className={`text-sm font-bold tracking-wide ${theme.text}`}>{bank.name}</span>
                                </div>
                                <ChevronRight size={16} className={`transition-transform duration-300 ${theme.subText} ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>

                            <div className={`
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${isExpanded ? 'max-h-[500px] opacity-100 border-t ' + theme.cardBorder : 'max-h-0 opacity-0'}
                            `}>
                                <div className="p-3 grid grid-cols-2 gap-2">
                                    {bank.cards.map(cardName => (
                                        <button
                                            key={cardName}
                                            onClick={() => toggleCardFilter(cardName)}
                                            className={`
                                                text-left px-3 py-2 text-xs border transition-all flex justify-between items-center ${theme.buttonShape}
                                                ${selectedCards.includes(cardName)
                                                    ? `${theme.text} ${theme.accentBorder} bg-black/5`
                                                    : `${theme.subText} border-transparent hover:bg-black/5`
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
                 className={`ml-auto px-8 py-3 ${theme.accentBg} text-white text-sm font-bold uppercase tracking-wider hover:opacity-90 shadow-lg ${theme.buttonShape}`}
               >
                 Apply Filter
               </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-opacity-90 transition-all border-b border-black/5 pt-4 pb-4 md:pt-6 md:pb-6 ${theme.bg}`}>
        <div className="w-full px-4">
          <div className="flex flex-col gap-4">
            
            <div className="flex justify-between items-start">
                <h1 className={`text-3xl font-black tracking-tighter uppercase leading-[0.85] ${theme.text} ${theme.fontDisplay}`}>
                    Reward
                    <span className={`block ${theme.fontDisplay === "font-['Playfair_Display']" ? 'italic font-light' : 'font-sans font-bold'} tracking-normal text-2xl mt-1 ${theme.accent}`}>
                    Engine.
                    </span>
                </h1>

                <div className="flex gap-2 items-center">
                    <div className="flex flex-col items-end mr-1">
                       <span className={`text-[8px] uppercase tracking-wider ${theme.subText}`}>Updated</span>
                       <span className={`text-[8px] font-mono ${theme.accent}`}>{lastUpdated}</span>
                    </div>
                    <button 
                        onClick={() => setUiStyle(prev => prev === 'nyc' ? 'korean' : 'nyc')}
                        className={`w-8 h-8 flex items-center justify-center rounded-full border ${theme.cardBorder} ${theme.bg} shadow-sm`}
                    >
                        {uiStyle === 'nyc' ? <Palette size={14} className={theme.subText} /> : <Heart size={14} className={theme.accent} fill="currentColor" />}
                    </button>
                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full border ${theme.cardBorder} ${theme.bg} shadow-sm`}
                    >
                        {isDarkMode ? <Sun size={14} className={theme.text} /> : <Moon size={14} className={theme.text} />}
                    </button>
                </div>
            </div>

            <div className={`relative w-full group ${theme.rounded === 'rounded-3xl' ? 'ml-0' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className={theme.subText} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search stores (e.g. Uber, 全聯...)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`
                        w-full pl-10 pr-4 py-2 text-sm bg-transparent border 
                        ${theme.cardBorder} ${theme.text} ${theme.buttonShape}
                        focus:outline-none focus:border-${isDarkMode ? 'white' : 'black'}
                        placeholder:text-neutral-400/50 transition-all
                    `}
                />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/5 py-3">
             <div className="flex gap-4 text-xs font-bold tracking-widest uppercase">
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
                className={`flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase ${theme.subText} hover:${theme.accent} transition-colors px-3 py-1 border border-transparent ${theme.buttonShape} hover:bg-black/5`}
             >
                <Filter size={12} />
                Filter View
             </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="w-full px-4 py-6 md:py-8">
        
        {viewMode === 'list' && (
          <div className="grid gap-6">
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
                  {/* Number - Only show in NYC style for cleanliness in Korean style */}
                  {uiStyle === 'nyc' && (
                    <div className={`absolute -left-2 -top-5 text-[60px] font-black leading-none opacity-5 select-none font-serif ${theme.text}`}>
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </div>
                  )}

                  {/* Registered Badge */}
                  {isRegistered && (
                    <div className={`absolute right-0 -top-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${theme.accentBg} text-white px-3 py-1 z-10 shadow-lg ${theme.buttonShape}`}>
                        <Check size={12} strokeWidth={3} />
                        Registered
                    </div>
                  )}

                  {/* Card Body */}
                  <div className={`relative ${uiStyle === 'nyc' ? 'border-t-2' : ''} ${isRegistered ? theme.accentBorder : (theme.text === 'text-white' ? 'border-white' : 'border-black')} pt-4 transition-colors duration-500 ${uiStyle === 'korean' ? `p-6 ${theme.cardBg} ${theme.shadow} ${theme.rounded}` : ''}`}>
                    
                    {/* Header Layout: Modified to place CardVisual on the LEFT */}
                    <div className="flex flex-col gap-4 mb-6">
                      
                      {/* Top Row: Checkbox + Card + Info */}
                      <div className="flex gap-4 z-10 items-start">
                        <button 
                          onClick={(e) => toggleRegistration(e, campaign.id)}
                          className={`
                            relative w-10 h-10 flex-shrink-0 border transition-all duration-300 flex items-center justify-center ${theme.buttonShape} self-start mt-1
                            ${isRegistered 
                              ? `${theme.accentBg} border-transparent text-white shadow-lg` 
                              : `bg-transparent ${theme.cardBorder === 'border-transparent' ? 'border-neutral-300' : theme.cardBorder} hover:border-${theme.accent.split('-')[1]}-400`}
                          `}
                        >
                          {isRegistered && <Check size={20} strokeWidth={3} />}
                        </button>

                        {/* Card Visual (Left Side) */}
                        <CardVisual 
                            image={campaign.image} 
                            gradient={campaign.gradient}
                            textColor={campaign.textColor}
                            cardName={campaign.card}
                            bankName={campaign.bank}
                            uiStyle={uiStyle}
                        />

                        {/* Text Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
                          <div>
                            <h3 className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-1 ${theme.accent} truncate`}>
                                {campaign.bank}
                            </h3>
                            
                            <div className="group/link flex items-center gap-2 mb-1">
                                <a 
                                    href={campaign.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()} 
                                    className={`
                                        text-xl ${theme.fontDisplay} ${theme.fontDisplay === "font-['Playfair_Display']" ? 'italic' : 'font-black'} leading-tight hover:opacity-70 transition-all truncate
                                        ${theme.text}
                                    `}
                                >
                                    {campaign.card}
                                </a>
                            </div>
                          </div>
                          
                          <div className={`flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold ${theme.subText}`}>
                            <span className={`border ${isDarkMode ? 'border-white/20' : 'border-black/10'} px-2 py-1 ${theme.buttonShape}`}>{campaign.mainTag}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {campaign.startDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Rate Display (Full Width) */}
                      <div className="flex justify-end items-baseline gap-2 relative border-t border-dashed border-white/10 pt-2">
                            <span className="text-[10px] text-neutral-500">MAX REWARD</span>
                            <div className={`text-4xl font-black tracking-tighter ${theme.text}`}>
                                {campaign.totalRate}<span className="text-xl ml-1 font-light">%</span>
                            </div>
                      </div>
                    </div>

                    {/* EXPANDABLE DETAILS */}
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        <div className={`pt-4 pb-4 ${uiStyle === 'nyc' ? 'border-t border-dashed border-neutral-800' : 'mt-4 bg-black/5 rounded-2xl p-4'}`}>
                            
                            {/* --- 重要注意事項區塊 --- */}
                            {campaign.importantNotesList && campaign.importantNotesList.map((note, index) => {
                                const noteId = `${campaign.id}_note_${index}`;
                                const isNoteRegistered = registeredIds.includes(noteId);
                                
                                return (
                                <div 
                                    key={index} 
                                    className={`
                                        mb-6 p-4 transition-all duration-300 relative overflow-hidden group/note
                                        ${uiStyle === 'nyc' ? 'border-l-4' : 'rounded-xl'}
                                        ${isNoteRegistered 
                                            ? `${uiStyle === 'nyc' ? 'border-[#D4AF37]' : ''} ${theme.accentBg} bg-opacity-10` 
                                            : `${uiStyle === 'nyc' ? 'border-neutral-500/30' : ''} ${isDarkMode ? 'bg-black/20' : 'bg-white'}`
                                        }
                                    `}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <AlertTriangle size={64} className={theme.text} />
                                    </div>

                                    {/* Header Row with Checkbox */}
                                    <div className="flex items-start gap-3 mb-3 relative z-10">
                                        {/* Sub-Checkbox */}
                                        <button 
                                            onClick={(e) => toggleRegistration(e, noteId)}
                                            className={`
                                                w-6 h-6 flex-shrink-0 border flex items-center justify-center transition-all duration-300 ${theme.buttonShape}
                                                ${isNoteRegistered 
                                                    ? `${theme.accentBg} border-transparent text-white shadow-md` 
                                                    : `bg-transparent border-neutral-400 hover:border-${theme.accent.split('-')[1]}-400`
                                                }
                                            `}
                                        >
                                            {isNoteRegistered && <Check size={14} strokeWidth={3} />}
                                        </button>

                                        <div>
                                            <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme.accent}`}>
                                                <AlertTriangle size={14} /> Important Notice {index + 1}
                                                {isNoteRegistered && <span className={`ml-2 text-[8px] ${theme.accentBg} text-white px-1.5 py-0.5 rounded-sm`}>COMPLETED</span>}
                                            </h4>
                                            <h5 className={`text-sm font-bold mt-1 ${isNoteRegistered ? `opacity-50 line-through decoration-2 ${uiStyle === 'nyc' ? 'decoration-[#D4AF37]' : 'decoration-rose-400'}` : theme.text}`}>
                                                {note.title}
                                            </h5>
                                        </div>
                                    </div>
                                    
                                    <p className={`mb-5 text-xs font-medium leading-relaxed pl-9 ${isDarkMode ? 'text-white' : 'text-black'} ${isNoteRegistered ? 'opacity-50' : ''}`}>
                                        {note.highlight}
                                    </p>

                                    <div className={`grid grid-cols-1 gap-3 mb-4 pl-9 ${isNoteRegistered ? 'opacity-50 grayscale' : ''}`}>
                                        {note.schedule.map((item, i) => (
                                            <div key={i} className={`p-3 border ${isDarkMode ? 'border-white/10' : 'border-black/10'} ${uiStyle === 'korean' ? 'rounded-lg bg-white/50' : ''}`}>
                                                <div className={`text-[10px] font-bold uppercase mb-1 ${theme.subText}`}>{item.month}</div>
                                                <div className={`text-xs font-mono font-bold mb-1 ${theme.text}`}>{item.time}</div>
                                                <div className={`text-[10px] ${theme.accent}`}>{item.limit}</div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <p className={`text-[10px] mt-2 opacity-70 pl-9 ${theme.subText}`}>
                                        {note.footer}
                                    </p>
                                </div>
                            )})}

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-4">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 border-l-2 pl-3 ${theme.text} ${theme.accentBorder}`}>
                                        Reward Structure
                                    </h4>
                                    <ul className="space-y-3">
                                        {campaign.details.map((detail, idx) => (
                                            <li key={idx} className="flex justify-between items-baseline text-xs group">
                                                <span className={`${theme.subText} group-hover:${theme.text} transition-colors`}>{detail.label}</span>
                                                <span className={`font-mono font-bold ${theme.text}`}>{detail.value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 border-l-2 pl-3 ${theme.text} ${theme.accentBorder}`}>
                                        Applicable Channels
                                    </h4>
                                    <div className="grid gap-3">
                                        {campaign.channels.map((channel, cIdx) => (
                                            <div key={cIdx} className={`p-4 ${isDarkMode ? 'bg-black/20' : 'bg-white'} border ${uiStyle === 'nyc' ? theme.cardBorder : 'border-transparent shadow-sm'} ${uiStyle === 'korean' ? 'rounded-xl' : ''} transition-colors`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`font-bold ${theme.text} text-xs flex items-center gap-2`}>
                                                        {channel.title}
                                                    </span>
                                                    <span className={`font-black text-lg italic ${theme.accent}`}>{channel.rate}</span>
                                                </div>
                                                <p className={`text-xs leading-5 ${theme.subText} text-justify`}>
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
                    <div className={`w-12 h-1 ${theme.accentBg} mx-auto rounded-full`}></div>
                </div>

                {['旅遊', '網購', '一般消費', '生活'].map((cat) => {
                    const topCards = INITIAL_CAMPAIGNS.filter(c => c.category === cat).sort((a,b) => b.totalRate - a.totalRate);
                    if (topCards.length === 0) return null;
                    const winner = topCards[0];

                    return (
                        <div key={cat} className={`grid gap-8 items-center border-b ${theme.cardBorder} pb-12`}>
                             <div>
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
                                    <div className={`mt-4 p-3 border-l-2 ${theme.accentBorder} ${isDarkMode ? 'bg-neutral-900/50' : 'bg-neutral-100'}`}>
                                        <div className="text-xs font-bold uppercase mb-1">Winning Factor</div>
                                        <div className={`text-sm ${theme.text}`}>{winner.details[1]?.value || winner.name}</div>
                                    </div>
                                </div>
                             </div>

                             {/* 如果有圖片則顯示卡片，否則顯示抽象圖 */}
                             <div className={`h-64 relative overflow-hidden flex items-center justify-center border ${theme.cardBorder} p-6`}>
                                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>
                                 
                                 {/* 使用 CardVisual 來確保這裡也能正確顯示 fallback */}
                                 <div className="scale-125 transform">
                                    <CardVisual 
                                        image={winner.image} 
                                        gradient={winner.gradient}
                                        textColor={winner.textColor}
                                        cardName={winner.card}
                                        bankName={winner.bank}
                                        uiStyle={uiStyle}
                                    />
                                 </div>
                             </div>
                        </div>
                    )
                })}
             </div>
        )}

      </main>
      </div>
    </div>
  );
};

export default App;
