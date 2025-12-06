import React, { createContext, useContext } from 'react';

// --- Security Utilities ---
export const TIMER_KEY = "__sys_integrity_token_FINAL_v7"; 
export const BAN_KEY = "__sys_access_violation_FINAL_v7"; 
export const ADMIN_KEY = "__sys_root_privilege_token"; 
export const FINGERPRINT_KEY = "__sys_device_fp_v1";
const SALT = "besoo_secure_hash_x99_v4_ultra_strict"; 

// --- IndexedDB Helper for Persistent Ban ---
const DB_NAME = 'BesooSystemDB';
const DB_STORE = 'security_logs';

const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined') return;
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE);
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

async function writeDB(key: string, value: string) {
    try {
        const db = await dbPromise;
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
    } catch (e) {}
}

async function readDB(key: string): Promise<string | undefined> {
    try {
        const db = await dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, 'readonly');
            const request = tx.objectStore(DB_STORE).get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(undefined);
        });
    } catch (e) { return undefined; }
}

export class SecureStorage {
  // --- Audio Fingerprinting (Very Sticky) ---
  static async getAudioFingerprint(): Promise<string> {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return "no_audio_ctx";

          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const analyser = context.createAnalyser();
          const gain = context.createGain();
          const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

          oscillator.type = 'triangle';
          oscillator.frequency.value = 10000;
          gain.gain.value = 0;
          
          oscillator.connect(gain);
          gain.connect(analyser);
          analyser.connect(scriptProcessor);
          scriptProcessor.connect(context.destination);

          return new Promise((resolve) => {
              scriptProcessor.onaudioprocess = (bins) => {
                  oscillator.stop();
                  scriptProcessor.disconnect();
                  context.close();
                  
                  // Hash the audio buffer
                  const array = new Float32Array(bins.inputBuffer.length);
                  bins.inputBuffer.copyFromChannel(array, 0);
                  let hash = 0;
                  for (let i = 0; i < array.length; i++) {
                      hash += Math.abs(array[i]);
                  }
                  resolve("audio_" + hash.toString());
              };
              oscillator.start(0);
          });
      } catch (e) {
          return "audio_error";
      }
  }

  // --- Advanced Fingerprinting ---
  static async generateFingerprint(): Promise<string> {
    try {
        // 1. Canvas Fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let canvasData = "no_canvas";
        if (ctx) {
            canvas.width = 200;
            canvas.height = 50;
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125,1,62,20);
            ctx.fillStyle = "#069";
            ctx.fillText("Besoo_Liker_Secure_v2", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("Protection", 4, 17);
            canvasData = canvas.toDataURL();
        }

        // 2. Audio Fingerprint
        const audioData = await SecureStorage.getAudioFingerprint();

        // 3. Hardware & Screen
        const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const hardwareConcurrency = navigator.hardwareConcurrency || "unknown";
        const deviceMemory = (navigator as any).deviceMemory || "unknown";
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;

        // 4. Combine & Hash
        const rawString = `${canvasData}|${audioData}|${screenInfo}|${hardwareConcurrency}|${deviceMemory}|${timezone}|${language}|${platform}`;
        
        // Robust Hash (DJB2 variant)
        let hash = 5381;
        for (let i = 0; i < rawString.length; i++) {
            hash = ((hash << 5) + hash) + rawString.charCodeAt(i);
        }
        return (hash >>> 0).toString(16);

    } catch (e) {
        return "fallback_fp_" + Date.now();
    }
  }

  // --- Strict Incognito Detection (Quota & FileSystem) ---
  static async isIncognitoMode(): Promise<boolean> {
      if (typeof window === 'undefined') return false;
      if (SecureStorage.isAdmin()) return false;

      // Check 1: Storage Quota (Modern Standard)
      // Incognito mode usually has a cap (e.g. 100MB or 10% of disk) which is distinct from normal mode
      try {
          if ('storage' in navigator && 'estimate' in navigator.storage) {
              const { quota } = await navigator.storage.estimate();
              // If quota is suspiciously low (less than 120MB), it's likely Incognito
              if (quota && quota < 120000000) return true;
          }
      } catch (e) {}

      // Check 2: Firefox Private Mode (IndexedDB Error)
      try {
          const db = indexedDB.open("test");
          db.onerror = function() { return true; };
      } catch (e) {
          return true;
      }

      // Check 3: Safari Private (LocalStorage write test)
      try {
          localStorage.setItem('__test_incognito__', '1');
          localStorage.removeItem('__test_incognito__');
      } catch (e) {
          return true; // Safari throws error in Private mode
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
  
  static async removeBan() {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(BAN_KEY);
      localStorage.removeItem(FINGERPRINT_KEY); 
      document.cookie = `${BAN_KEY}=; path=/; max-age=0`;
      await writeDB(BAN_KEY, ""); // Clear from DB
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
      // 3. IndexedDB (Persistent)
      await writeDB(BAN_KEY, encrypted);
      
      // 4. Fingerprint Ban (Persistent Identity)
      const fp = await SecureStorage.generateFingerprint();
      // We save the fingerprint as BANNED in the local storage logic
      localStorage.setItem(`${FINGERPRINT_KEY}_${fp}`, encrypted);
  }

  static async getBan(): Promise<number | null> {
      if (typeof window === 'undefined') return null;
      if (SecureStorage.isAdmin()) return null;

      // Check 1: Fingerprint (Primary identity check)
      const fp = await SecureStorage.generateFingerprint();
      const fpBan = localStorage.getItem(`${FINGERPRINT_KEY}_${fp}`);
      if (fpBan) {
          const decrypted = SecureStorage.decrypt(fpBan);
          if (decrypted) return parseInt(decrypted);
      }

      // Check 2: IndexedDB (Persistent storage check)
      const dbVal = await readDB(BAN_KEY);
      if (dbVal) {
          const decrypted = SecureStorage.decrypt(dbVal);
          if (decrypted) return parseInt(decrypted);
      }

      // Check 3: LocalStorage
      let val = localStorage.getItem(BAN_KEY);
      
      // Check 4: Cookies
      if (!val) {
          const match = document.cookie.match(new RegExp('(^| )' + BAN_KEY + '=([^;]+)'));
          if (match) val = match[2];
      }

      const decrypted = SecureStorage.decrypt(val);
      if (decrypted) {
          // If found in weak storage, reinforce it in strong storage (IndexedDB)
          writeDB(BAN_KEY, val!);
          return parseInt(decrypted);
      }
      return null;
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
        desc: "تم اكتشاف نشاط مريب أو انتهاك للشروط. الحظر مرتبط ببصمة جهازك.",
        timer: "ينتهي الحظر خلال:"
    },
    adblock: {
        title: "تم كشف حظر الإعلانات",
        desc: "يرجى تعطيل AdBlock أو Brave Shield للمتابعة."
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