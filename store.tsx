import React, { createContext, useContext } from 'react';

// --- Security Utilities ---
// تحديث المفاتيح لنسخة (V7 Ultra Strict)
export const TIMER_KEY = "__sys_integrity_token_FINAL_v7"; 
export const BAN_KEY = "__sys_access_violation_FINAL_v7"; 
export const ADMIN_KEY = "__sys_root_privilege_token"; 
export const FINGERPRINT_KEY = "__sys_device_fp_v1";
const SALT = "besoo_secure_hash_x99_v4_ultra_strict"; 

export class SecureStorage {
  // --- Fingerprinting Logic ---
  static async generateFingerprint(): Promise<string> {
    try {
        // 1. Canvas Fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return "unknown_device";
        
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText("Besoo_Liker_Secure", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Protection", 4, 17);
        
        const canvasData = canvas.toDataURL();

        // 2. Hardware Info
        const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const hardwareConcurrency = navigator.hardwareConcurrency || "unknown";
        const deviceMemory = (navigator as any).deviceMemory || "unknown";
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const userAgent = navigator.userAgent;

        // 3. Combine & Hash
        const rawString = `${canvasData}|${screenInfo}|${hardwareConcurrency}|${deviceMemory}|${timezone}|${language}|${userAgent}`;
        
        // Simple Hash Function (DJB2)
        let hash = 5381;
        for (let i = 0; i < rawString.length; i++) {
            hash = (hash * 33) ^ rawString.charCodeAt(i);
        }
        return (hash >>> 0).toString(16);

    } catch (e) {
        return "fallback_fingerprint_" + Date.now();
    }
  }

  // --- Strict Incognito Detection ---
  static async isIncognitoMode(): Promise<boolean> {
      if (typeof window === 'undefined') return false;
      if (SecureStorage.isAdmin()) return false;

      // Check 1: Storage Quota (Standard for Chrome/Firefox)
      try {
          if ('storage' in navigator && 'estimate' in navigator.storage) {
              const { quota } = await navigator.storage.estimate();
              // Incognito usually has a much lower quota limit (e.g. < 120MB)
              if (quota && quota < 120000000) return true;
          }
      } catch (e) {}

      // Check 2: Try/Catch LocalStorage (Safari/Old Browsers)
      try {
          localStorage.setItem('__test_incognito__', '1');
          localStorage.removeItem('__test_incognito__');
      } catch (e) {
          return true; // If we can't write to LS, treat as Incognito/Block
      }

      return false;
  }

  static encrypt(value: string) {
    try {
      if (typeof window === 'undefined') return "";
      return btoa(`${value}|${SALT}|${navigator.userAgent.slice(0, 10)}`);
    } catch (e) { return ""; }
  }

  static decrypt(value: string | null) {
    if (!value || typeof window === 'undefined') return null;
    try {
      const decoded = atob(value);
      const [data, salt, ua] = decoded.split("|");
      if (salt !== SALT) return null; 
      if (ua !== navigator.userAgent.slice(0, 10)) return null;
      return data;
    } catch (e) { return null; }
  }

  static setItem(value: string) {
    if (typeof window === 'undefined') return;
    if (SecureStorage.isAdmin()) return;

    const encrypted = SecureStorage.encrypt(value);
    localStorage.setItem(TIMER_KEY, encrypted);
    document.cookie = `${TIMER_KEY}=${encrypted}; path=/; max-age=86400; SameSite=Strict`;
  }

  static getItem(): string | null {
    if (typeof window === 'undefined') return null;
    if (SecureStorage.isAdmin()) return null;

    let val = localStorage.getItem(TIMER_KEY);
    if (!val) {
      const match = document.cookie.match(new RegExp('(^| )' + TIMER_KEY + '=([^;]+)'));
      if (match) {
        val = match[2];
        localStorage.setItem(TIMER_KEY, val);
      }
    } else {
        document.cookie = `${TIMER_KEY}=${val}; path=/; max-age=86400; SameSite=Strict`;
    }
    return SecureStorage.decrypt(val);
  }

  static removeItem() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TIMER_KEY);
    document.cookie = `${TIMER_KEY}=; path=/; max-age=0`;
  }
  
  static removeBan() {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(BAN_KEY);
      localStorage.removeItem(FINGERPRINT_KEY); 
      document.cookie = `${BAN_KEY}=; path=/; max-age=0`;
      window.dispatchEvent(new Event("storage"));
  }

  static setAdmin() {
      if (typeof window === 'undefined') return;
      localStorage.setItem(ADMIN_KEY, SecureStorage.encrypt("GRANTED"));
  }

  static isAdmin() {
      if (typeof window === 'undefined') return false;
      const val = localStorage.getItem(ADMIN_KEY);
      return SecureStorage.decrypt(val) === "GRANTED";
  }

  static async setBan(timestamp: number) {
      if (typeof window === 'undefined') return;
      if (SecureStorage.isAdmin()) return;

      const encrypted = SecureStorage.encrypt(timestamp.toString());
      
      // 1. Local Storage
      localStorage.setItem(BAN_KEY, encrypted);
      // 2. Cookie
      document.cookie = `${BAN_KEY}=${encrypted}; path=/; max-age=86400; SameSite=Strict`;
      
      // 3. Fingerprint Ban (Most Important)
      const fp = await SecureStorage.generateFingerprint();
      // Store in a way that attempts to persist
      localStorage.setItem(`${FINGERPRINT_KEY}_${fp}`, encrypted);
  }

  static async getBan(): Promise<number | null> {
      if (typeof window === 'undefined') return null;
      if (SecureStorage.isAdmin()) return null;

      // Check 1: Fingerprint (Primary)
      const fp = await SecureStorage.generateFingerprint();
      const fpBan = localStorage.getItem(`${FINGERPRINT_KEY}_${fp}`);
      if (fpBan) {
          const decrypted = SecureStorage.decrypt(fpBan);
          if (decrypted) return parseInt(decrypted);
      }

      // Check 2: LocalStorage
      let val = localStorage.getItem(BAN_KEY);
      
      // Check 3: Cookies
      if (!val) {
          const match = document.cookie.match(new RegExp('(^| )' + BAN_KEY + '=([^;]+)'));
          if (match) val = match[2];
      }

      const decrypted = SecureStorage.decrypt(val);
      return decrypted ? parseInt(decrypted) : null;
  }
}

// --- Translations ---
const defaultEn = {
    header: { home: 'Home', contact: 'Contact Us', share: 'Share Website' },
    footer: {
      privacy: 'Privacy Policy', rights: 'All rights reserved',
      modal: {
        title: 'Privacy & Security', introTitle: 'Introduction', introText: 'Welcome to Besoo Liker.',
        collectTitle: 'Data Collection', collectText: 'We do not collect sensitive personal data.',
        securityTitle: 'Security', securityText: 'We use high-grade encryption.',
        disclaimerTitle: 'Disclaimer', disclaimerText: 'This tool is for educational purposes only.',
        agree: 'Using this tool means you agree.', close: 'Close'
      }
    },
    home: {
      title: 'Besoo Liker', subtitle: '100% Real & Safe', desc: 'Boost your posts with one click.',
      instant: 'Instant', safe: 'Safe', start: 'Start Now', wow: 'WOW'
    },
    info: { 
      pageNum: 'Page 1 of 3', buttonReady: 'Proceed', buttonWait: 'Please Wait...',
      welcomeTitle: '⭐ Welcome', welcomeDesc: 'Smart tool to boost visibility.',
      featuresTitle: '🚀 Features', feat1Title: 'Instant:', feat1Desc: 'Real reactions.',
      feat2Title: 'Security:', feat2Desc: 'No password.', feat3Title: 'Easy:', feat3Desc: 'Simple interface.'
    },
    faq: { 
      pageNum: 'Page 2 of 3', checking: 'Checking...', seconds: 's', buttonProceed: 'Proceed', buttonWait: 'Wait...',
      title: '🌐 How it works?', step1Title: 'No SignUp', step1Desc: 'Safe.',
      step2Title: 'Select Post', step2Desc: 'Copy link.', step3Title: 'Send', step3Desc: 'Choose reaction.',
      step4Title: 'Results', step4Desc: 'Watch counter.'
    },
    timer: { 
      finalStep: 'Final Step', buttonGet: 'Proceed', buttonPrep: 'Loading...',
      faqTitle: '💬 FAQ', q1: 'Safe?', a1: 'Yes.', q2: 'Real?', a2: 'Yes.', q3: 'Free?', a3: 'Yes.', ready: '🔥 Ready!'
    },
    final: {
      placeholder: 'Post Link', wait: 'Wait', send: 'Send', sending: 'Sending...',
      toast: { success: 'Success', sent: 'Sent', error: 'Alert', fill: 'Fill data', invalidFb: 'Invalid Link', oneEmoji: 'One emoji only', fail: 'Error', ok: 'OK', bot: 'Bot Detected' },
      msg: { req: 'Request', link: 'Link', react: 'React', visitor: 'Visitor' },
      ssl: 'SSL Secure'
    },
    security: { alert: 'Security Alert', desc: 'Action blocked for security reasons.' },
    incognito: { title: "Private Mode Detected", desc: "This site does not work in Incognito/Private mode for security reasons. Please open in a regular tab." },
    ban: { title: "Access Restricted", desc: "Suspicious activity detected.", timer: "Lifted in:" },
    adblock: { title: "Security Check Failed", desc: "Please disable AdBlock or Brave Shields to continue." },
    shortener: { title: "Direct Access Blocked", desc: "Please start from the home page. Direct links or shorteners are not allowed." }
};

export const translations = {
  ar: {
    header: { home: 'الرئيسية', contact: 'اتصل بنا', share: 'مشاركة الموقع' },
    footer: {
      privacy: 'سياسة الخصوصية', rights: 'جميع الحقوق محفوظة',
      modal: {
        title: 'سياسة الخصوصية والأمان', introTitle: 'مقدمة', introText: 'مرحباً بك في Besoo Liker. نحن نلتزم بحماية خصوصيتك وضمان أن تكون تجربتك آمنة ومريحة.',
        collectTitle: 'المعلومات التي نجمعها', collectText: 'نحن لا نقوم بجمع معلومات شخصية حساسة. البيانات التي قد يتم جمعها تقتصر على المعلومات التقنية الأساسية.',
        securityTitle: 'أمان حسابك', securityText: 'نحن نستخدم أحدث تقنيات التشفير لحماية أي اتصال بينك وبين خوادمنا.',
        disclaimerTitle: 'إخلاء المسؤولية', disclaimerText: 'هذه الأداة مصممة لأغراض تعليمية وترفيهية.',
        agree: 'استخدامك لبيسو لايكر يعني موافقتك على هذه الشروط.', close: 'موافق وإغلاق'
      }
    },
    home: {
      title: 'Besoo Liker', subtitle: 'زيادة تفاعل حقيقية وآمنة 100%', desc: 'عزز منشوراتك بضغطة زر. نظام آمن، سريع، ويدعم جميع التفاعلات.',
      instant: 'فوري', safe: 'آمن', start: 'ابدأ الآن', wow: 'واو'
    },
    info: { 
      pageNum: 'الصفحة 1 من 3', buttonReady: 'اضغط هنا للمتابعة', buttonWait: 'يرجى الانتظار...',
      welcomeTitle: '⭐ أهلاً بك في Besoo Liker',
      welcomeDesc: 'أصبح جذب الإعجابات والتفاعلات أسهل من أي وقت مضى. الأداة الذكية لتعزيز ظهور منشوراتك.',
      featuresTitle: '🚀 مميزات تجعلنا اختيارك الأول',
      feat1Title: 'تفاعل فوري:', feat1Desc: 'احصل على تفاعلات حقيقية خلال لحظات.',
      feat2Title: 'أمان تام:', feat2Desc: 'تشفير كامل للبيانات ولا نطلب كلمة مرور.',
      feat3Title: 'سهولة الاستخدام:', feat3Desc: 'واجهة بسيطة تناسب الجميع.'
    },
    faq: { 
      pageNum: 'الصفحة 2 من 3', checking: 'جاري التحقق...', seconds: 'ثانية', buttonProceed: 'اضغط هنا للمتابعة', buttonWait: 'انتظر قليلاً...',
      title: '🌐 كيف يعمل النظام؟',
      step1Title: 'بدون تسجيل', step1Desc: 'لا يجب عليك التسجيل، أمان تام.',
      step2Title: 'تحديد المنشور', step2Desc: 'انسخ رابط المنشور الذي تريد زيادة تفاعله.',
      step3Title: 'إرسال التفاعلات', step3Desc: 'اختر رياكت مناسب ثم اضغط إرسال لايكات.',
      step4Title: 'مشاهدة النتائج', step4Desc: 'راقب زيادة تفاعل في دقائق'
    },
    timer: { 
      finalStep: 'الخطوة الأخيرة', buttonGet: 'اضغط هنا للمتابعة', buttonPrep: 'جاري التحميل...',
      faqTitle: '💬 الأسئلة الأكثر شيوعًا',
      q1: 'هل الموقع آمن؟', a1: 'نعم، نحن نستخدم تشفير SSL كامل.',
      q2: 'هل التفاعلات حقيقية؟', a2: 'نعم، التفاعلات تأتي من مستخدمين نشطين.',
      q3: 'هل الخدمة مجانية؟', a3: 'نعم! ولزيادة التفاعلات تواصل معنا.',
      ready: '🔥 الخدمة جاهزة للاستخدام الآن!'
    },
    final: {
      placeholder: 'رابط المنشور', wait: 'يرجى الانتظار', send: 'إرسال التفاعل', sending: 'جارٍ الإرسال...',
      toast: { success: 'نجاح', sent: 'تم الإرسال بنجاح', error: 'تنبيه', fill: 'يرجى ملء البيانات', invalidFb: 'رابط فيسبوك غير صالح', oneEmoji: 'إيموجي واحد فقط', fail: 'خطأ في الإرسال', ok: 'موافق', bot: 'تم كشف نشاط آلي' },
      msg: { req: 'طلب جديد', link: 'الرابط', react: 'التفاعل', visitor: 'زائر' },
      ssl: 'اتصال آمن SSL'
    },
    security: {
        alert: 'تنبيه أمني',
        desc: 'عذراً، هذا الإجراء غير مسموح به حفاظاً على الأمان.'
    },
    incognito: {
        title: "وضع التصفح الخفي مرفوض",
        desc: "لأسباب أمنية ولحماية النظام، يمنع استخدام الموقع في الوضع المتخفي (Incognito). يرجى فتح الموقع في متصفح عادي."
    },
    ban: {
        title: "تم حظر الوصول",
        desc: "تم اكتشاف نشاط مريب أو محاولة استخدام الموقع مرتين. الحماية مفعلة.",
        timer: "ينتهي الحظر خلال:"
    },
    adblock: {
        title: "تم كشف حظر الإعلانات",
        desc: "يرجى تعطيل AdBlock أو Brave Shield للمتابعة. المتصفحات التي تحجب السكربتات غير مدعومة."
    },
    shortener: {
        title: "دخول غير مصرح به",
        desc: "يجب البدء من الصفحة الرئيسية واتباع الخطوات. الروابط المباشرة ممنوعة."
    }
  },
  en: defaultEn,
  es: { ...defaultEn },
  fr: { ...defaultEn },
  de: { ...defaultEn },
  ru: { ...defaultEn },
  zh: { ...defaultEn },
  pt: { ...defaultEn },
};

export type Lang = 'ar' | 'en' | 'es' | 'fr' | 'de' | 'ru' | 'zh' | 'pt';

interface AppContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  isAdmin: boolean;
  t: typeof translations.ar;
}

export const AppContext = createContext<AppContextType>({
  lang: 'ar',
  setLang: () => {},
  toggleLang: () => {},
  isAdmin: false,
  t: translations.ar,
});

export const useAppConfig = () => useContext(AppContext);