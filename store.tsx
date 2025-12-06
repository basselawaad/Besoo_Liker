import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

// --- Telegram Configuration ---
export const TG_BOT_TOKEN = "8282477678:AAElPQVX-xemNjC79ojZfQLMpTxOzXXWRVE";
export const TG_CHAT_ID = "1838195482";

// --- Security Utilities ---
export const TIMER_KEY = "__sys_integrity_token_FINAL_v7"; 
export const BAN_KEY = "__sys_access_violation_FINAL_v7"; 
export const ADMIN_KEY = "__sys_root_privilege_token"; 
export const FINGERPRINT_KEY = "__sys_device_fp_v1";
export const AUTH_SESSION_KEY = "besoo_auth_session_v1";
export const USERS_DB_KEY = "besoo_users_db_v1";

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

  static async generateFingerprint(): Promise<string> {
    try {
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

        const audioData = await SecureStorage.getAudioFingerprint();
        const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const hardwareConcurrency = navigator.hardwareConcurrency || "unknown";
        const deviceMemory = (navigator as any).deviceMemory || "unknown";
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;

        const rawString = `${canvasData}|${audioData}|${screenInfo}|${hardwareConcurrency}|${deviceMemory}|${timezone}|${language}|${platform}`;
        
        let hash = 5381;
        for (let i = 0; i < rawString.length; i++) {
            hash = ((hash << 5) + hash) + rawString.charCodeAt(i);
        }
        return (hash >>> 0).toString(16);

    } catch (e) {
        return "fallback_fp_" + Date.now();
    }
  }

  static async isIncognitoMode(): Promise<boolean> {
      if (typeof window === 'undefined') return false;
      if (SecureStorage.isAdmin()) return false;
      try {
          if ('storage' in navigator && 'estimate' in navigator.storage) {
              const { quota } = await navigator.storage.estimate();
              if (quota && quota < 120000000) return true;
          }
      } catch (e) {}
      try {
          const db = indexedDB.open("test");
          db.onerror = function() { return true; };
      } catch (e) { return true; }
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
      await writeDB(BAN_KEY, ""); 
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
      localStorage.setItem(BAN_KEY, encrypted);
      document.cookie = `${BAN_KEY}=${encrypted}; path=/; max-age=86400; SameSite=Strict`;
      await writeDB(BAN_KEY, encrypted);
      const fp = await SecureStorage.generateFingerprint();
      localStorage.setItem(`${FINGERPRINT_KEY}_${fp}`, encrypted);
  }

  static async getBan(): Promise<number | null> {
      if (typeof window === 'undefined') return null;
      if (SecureStorage.isAdmin()) return null;
      const fp = await SecureStorage.generateFingerprint();
      const fpBan = localStorage.getItem(`${FINGERPRINT_KEY}_${fp}`);
      if (fpBan) {
          const decrypted = SecureStorage.decrypt(fpBan);
          if (decrypted) return parseInt(decrypted);
      }
      const dbVal = await readDB(BAN_KEY);
      if (dbVal) {
          const decrypted = SecureStorage.decrypt(dbVal);
          if (decrypted) return parseInt(decrypted);
      }
      let val = localStorage.getItem(BAN_KEY);
      if (!val) {
          const match = document.cookie.match(new RegExp('(^| )' + BAN_KEY + '=([^;]+)'));
          if (match) val = match[2];
      }
      const decrypted = SecureStorage.decrypt(val);
      if (decrypted) {
          writeDB(BAN_KEY, val!);
          return parseInt(decrypted);
      }
      return null;
    }
}

// --- Centralized Telegram Logger ---
export const sendTelegramLog = async (status: 'BANNED' | 'GOOD_USER' | 'WARNING' | 'NEW_USER' | 'LOGIN', reason: string, details: string = "") => {
    try {
        const deviceId = await SecureStorage.generateFingerprint();
        const now = new Date().toLocaleString('ar-EG');
        
        let emoji = "✅";
        if (status === 'BANNED') emoji = "🚫";
        if (status === 'WARNING') emoji = "⚠️";
        if (status === 'NEW_USER') emoji = "👤";
        if (status === 'LOGIN') emoji = "🔑";

        const message = `🛡️ *نظام الحماية - Besoo Liker*\n\n` +
                        `${emoji} *الحالة:* ${status}\n` +
                        `📝 *الحدث:* ${reason}\n` +
                        `📱 *بصمة الجهاز:* \`${deviceId}\`\n` +
                        `⏰ *التوقيت:* ${now}\n` +
                        `${details ? `📄 *تفاصيل:* ${details}` : ''}`;

        const params = new URLSearchParams({
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?${params.toString()}`, { mode: 'no-cors' });
    } catch (e) {
        console.error("Log Error", e);
    }
};

const AR_TRANSLATIONS = {
    system: { loading: 'جاري تحميل النظام...', connect: 'جاري تهيئة الاتصال...', protection: 'نظام الحماية نشط', wait: 'يجب الانتظار قبل الطلب الجديد', copy: 'تم نسخ الرابط' },
    auth: {
        loginTitle: "تسجيل الدخول", signupTitle: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", 
        confirmPassword: "تأكيد كلمة المرور", name: "الاسم الكامل",
        loginBtn: "دخول", signupBtn: "التالي", noAccount: "ليس لديك حساب؟", haveAccount: "لديك حساب بالفعل؟",
        errorEmpty: "يرجى ملء جميع الحقول", errorMatch: "كلمات المرور غير متطابقة", errorExists: "البريد الإلكتروني مسجل مسبقاً",
        errorInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة", successSignup: "تم إنشاء الحساب بنجاح", logout: "تسجيل خروج",
        googleBtn: "تسجيل الدخول باستخدام جوجل",
        verifyTitle: "إثبات ملكية البريد", verifyText: "أدخل الرمز الذي تم إرساله إلى بريدك الإلكتروني", verifyCode: "أدخل الرمز", verifyBtn: "تأكيد", resend: "إعادة إرسال"
    },
    header: { home: 'الرئيسية', contact: 'اتصل بنا', share: 'مشاركة الموقع', shareTitle: 'زيادة لايكات فيسبوك مجاناً', shareText: '🚀 أقوى موقع لزيادة لايكات فيسبوك مجاناً! \n💯 تفاعل حقيقي ومضمون 100% \n🔒 آمن تماماً وبدون كلمة سر \nجربه الآن 👇' },
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
      welcomeDesc: 'أصبح جذب الإعجابات والتفاعلات على فيسبوك أسهل من أي وقت مضى مع Besoo Liker، الأداة الذكية التي تم تطويرها لتساعدك على تعزيز ظهور منشوراتك بشكل آمن وفعّال.',
      welcomeSub: 'منصتك الأفضل لزيادة التفاعل!',
      feat1Title: 'تفاعل فوري وسريع', feat1Desc: 'احصل على إعجابات وتفاعلات حقيقية خلال لحظات! بمجرد تحديد المنشور، يبدأ النظام بإرسال التفاعل مباشرة.',
      feat2Title: 'حماية وخصوصية موثوقة', feat2Desc: 'يستخدم Besoo Liker أحدث تقنيات التشفير لضمان أمان كامل لحسابك. لا يقوم بحفظ أي بيانات حساسة.',
      feat3Title: 'واجهة سهلة وبسيطة', feat3Desc: 'تم تصميم المنصة لتكون واضحة وسهلة الاستخدام لجميع الفئات، ما يتيح لك أداء كل خطوة دون تعقيد.',
      feat4Title: 'توفير وقت وجهد', feat4Desc: 'بدلاً من المحاولات اليدوية للحصول على التفاعل، يقوم Besoo Liker بالمهمة نيابة عنك.',
      feat5Title: 'استهداف دقيق لمنشوراتك', feat5Desc: 'اختر المنشورات التي تحتاج إلى تعزيز، واترك الخوارزمية الذكية تحدد أفضل توقيت.',
      feat6Title: 'تفاعل حقيقي 100%', feat6Desc: 'هنا لن تجد حسابات وهمية أو روبوتات. جميع التفاعلات تأتي من مستخدمين فعليين.'
    },
    faq: { 
      pageNum: 'الصفحة 2 من 3', checking: 'جاري التحقق...', seconds: 'ثانية', buttonProceed: 'اضغط هنا للمتابعة', buttonWait: 'يرجى الانتظار...',
      title: '🌐 كيف يعمل Besoo Liker؟', sub: 'خطوات بسيطة لزيادة تفاعلك',
      step1Title: '1️⃣ تسجيل الدخول', step1Desc: 'سجّل دخولك من خلال حساب فيسبوك بسهولة وأمان، دون أي نشر تلقائي على صفحتك.',
      step2Title: '2️⃣ تحديد المنشور', step2Desc: 'اختر المنشور أو الصورة التي تريد تعزيز ظهورها وزيادة التفاعل عليها.',
      step3Title: '3️⃣ تنفيذ العملية', step3Desc: 'يبدأ النظام تلقائيًا في إرسال الإعجابات والتفاعلات المطلوبة فوراً.',
      step4Title: '4️⃣ مشاهدة النتائج', step4Desc: 'راقب تفاعل منشوراتك يرتفع بشكل ملموس خلال دقائق معدودة!'
    },
    timer: { 
      finalStep: 'الخطوة الأخيرة', buttonGet: 'اضغط هنا للمتابعة', buttonPrep: 'جاري التحميل...',
      faqTitle: '💬 الأسئلة الأكثر شيوعًا',
      ctaTitle: '🔥 ابدأ الآن وارتقِ بحسابك على فيسبوك!', ctaDesc: 'لا تفوّت فرصة تعزيز ظهور منشوراتك—جرّب Besoo Liker اليوم.',
      q1: 'هل Besoo Liker آمن؟', a1: 'نعم، فهو يعتمد بروتوكولات أمان قوية لحماية بياناتك دون تخزين أي معلومات شخصية.',
      q2: 'هل التفاعلات حقيقية؟', a2: 'تمامًا، جميع الإعجابات تأتي من مستخدمين حقيقيين.',
      q3: 'هل يمكنني اختيار منشورات معينة؟', a3: 'نعم، يمكنك التحكم الكامل في اختيار المنشور الذي ترغب في تعزيزه.',
      q4: 'كم من الوقت يستغرق وصول الإعجابات؟', a4: 'في العادة ستظهر خلال دقائق قليلة فقط.',
      q5: 'هل هناك حد يومي؟', a5: 'نعم، وذلك حفاظًا على سلامة حسابك وتقليل أي مخاطر محتملة.',
      q6: 'هل يناسب الاستخدام التجاري؟', a6: 'بالطبع، فهو مثالي للشركات والمؤثرين والمسوقين.',
      q7: 'هل يتطلب تثبيت برنامج؟', a7: 'لا، النظام يعمل من خلال الويب فقط دون أي تحميل.'
    },
    final: {
      placeholder: 'رابط المنشور', wait: 'يرجى الانتظار', send: 'إرسال التفاعل', sending: 'جارٍ الإرسال...',
      toast: { success: 'نجاح', sent: 'تم الإرسال بنجاح', error: 'تنبيه', fill: 'يرجى ملء البيانات', invalidFb: 'رابط فيسبوك غير صالح', oneEmoji: 'إيموجي واحد فقط', fail: 'خطأ في الإرسال', ok: 'موافق', bot: 'تم كشف نشاط آلي' },
      msg: { req: 'طلب جديد', link: 'الرابط', react: 'التفاعل', visitor: 'زائر' },
      ssl: 'اتصال آمن SSL'
    },
    shortener: {
        step1: "الخطوة 1 من 3",
        step2: "الخطوة 2 من 3",
        step3: "الخطوة 3 من 3",
        prep: "جاري تجهيز الرابط...",
        wait: "يرجى الانتظار",
        ad: "إعلان ممول",
        next: "الخطوة التالية",
        get: "جلب الرابط",
        secure: "رابط آمن",
        generating: "جاري إنشاء الوجهة...",
        ready: "الرابط جاهز!"
    },
    security: { alert: 'تنبيه أمني', desc: 'عذراً، هذا الإجراء غير مسموح به حفاظاً على الأمان.' },
    incognito: { title: "وضع التصفح الخفي مرفوض", desc: "لأسباب أمنية، يمنع استخدام الموقع في الوضع المتخفي (Incognito). يرجى فتح الموقع في متصفح عادي." },
    ban: { title: "تم حظر الوصول", desc: "لقد قمت بمخالفه استخدام الموقع", timer: "ينتهي الحظر خلال:" },
    adblock: { title: "تم كشف حظر الإعلانات", desc: "يرجى تعطيل AdBlock للمتابعة." },
    shortenerPage: { title: "دخول غير مصرح به", desc: "يجب البدء من الصفحة الرئيسية." }
};

const EN_TRANSLATIONS = {
    system: { loading: 'LOADING SYSTEM...', connect: 'Connecting to Server...', protection: 'Protection System Active', wait: 'Wait before new request', copy: 'Link Copied' },
    auth: {
        loginTitle: "Login", signupTitle: "Create Account", email: "Email Address", password: "Password", 
        confirmPassword: "Confirm Password", name: "Full Name",
        loginBtn: "Login", signupBtn: "Next", noAccount: "Don't have an account?", haveAccount: "Already have an account?",
        errorEmpty: "Please fill all fields", errorMatch: "Passwords do not match", errorExists: "Email already exists",
        errorInvalid: "Invalid Email or Password", successSignup: "Account created successfully", logout: "Logout",
        googleBtn: "Sign in with Google",
        verifyTitle: "Verify your email", verifyText: "Enter the 6-digit code sent to your email", verifyCode: "Enter Code", verifyBtn: "Verify", resend: "Resend Code"
    },
    header: { home: 'Home', contact: 'Contact Us', share: 'Share Website', shareTitle: 'Free Facebook Likes', shareText: '🚀 Best site to increase Facebook Likes for FREE! \n💯 100% Real & Safe Engagement \n🔒 No Password Required \nTry it now 👇' },
    footer: {
      privacy: 'Privacy Policy', rights: 'All rights reserved',
      modal: { title: 'Privacy & Security', introTitle: 'Introduction', introText: 'Welcome to Besoo Liker. We are committed to protecting your privacy.', collectTitle: 'Data Collection', collectText: 'We do not collect sensitive personal data. Only basic technical info is used.', securityTitle: 'Security', securityText: 'We use high-grade encryption for all communications.', disclaimerTitle: 'Disclaimer', disclaimerText: 'This tool is for educational purposes only.', agree: 'Using this tool means you agree to these terms.', close: 'Close' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Real & Safe', desc: 'Boost your posts with one click. Safe, fast, and supports all interactions.', instant: 'Instant', safe: 'Safe', start: 'Start Now', wow: 'WOW' },
    info: { 
      pageNum: 'Page 1 of 3', buttonReady: 'Click to Proceed', buttonWait: 'Please Wait...',
      welcomeTitle: '⭐ Welcome to Besoo Liker',
      welcomeDesc: 'Getting likes and engagement on Facebook has never been easier with Besoo Liker, the smart tool developed to boost your post visibility safely and effectively.',
      welcomeSub: 'Your best platform for engagement!',
      feat1Title: 'Instant Interaction', feat1Desc: 'Get real likes and reactions in moments! Once you select the post, the system starts sending engagement immediately.',
      feat2Title: 'Reliable Security', feat2Desc: 'Besoo Liker uses the latest encryption to ensure account safety. We do not store sensitive data.',
      feat3Title: 'Easy Interface', feat3Desc: 'The platform is designed to be clear and easy to use for everyone, allowing you to perform every step without complexity.',
      feat4Title: 'Save Time', feat4Desc: 'Instead of manual attempts to get engagement, Besoo Liker does the hard work for you.',
      feat5Title: 'Precise Targeting', feat5Desc: 'Choose the posts you need to boost, and let the smart algorithm determine the best timing.',
      feat6Title: '100% Real Engagement', feat6Desc: 'You wont find fake accounts or bots here. All interactions come from real users.'
    },
    faq: { 
      pageNum: 'Page 2 of 3', checking: 'Checking...', seconds: 'Seconds', buttonProceed: 'Click to Proceed', buttonWait: 'Please Wait...',
      title: '🌐 How Besoo Liker Works?', sub: 'Simple steps to boost engagement',
      step1Title: '1️⃣ Login', step1Desc: 'Log in safely using your Facebook account, without any auto-posting on your page.',
      step2Title: '2️⃣ Select Post', step2Desc: 'Choose the post or photo you want to boost visibility and engagement for.',
      step3Title: '3️⃣ Process', step3Desc: 'The system automatically starts sending the requested likes and reactions immediately.',
      step4Title: '4️⃣ Results', step4Desc: 'Watch your post engagement rise significantly within just a few minutes!'
    },
    timer: { 
      finalStep: 'Final Step', buttonGet: 'Click to Proceed', buttonPrep: 'Loading...',
      faqTitle: '💬 Frequently Asked Questions',
      ctaTitle: '🔥 Start Now & Boost Your Facebook!', ctaDesc: 'Do not miss the chance to boost your posts—Try Besoo Liker today.',
      q1: 'Is Besoo Liker Safe?', a1: 'Yes, it relies on strong security protocols to protect your data without storing personal info.',
      q2: 'Are interactions real?', a2: 'Absolutely, all likes come from real users.',
      q3: 'Can I choose specific posts?', a3: 'Yes, you have full control to choose which post to boost.',
      q4: 'How long does it take?', a4: 'Usually, likes appear within just a few minutes.',
      q5: 'Is there a daily limit?', a5: 'Yes, to maintain account safety and reduce potential risks.',
      q6: 'Is it for commercial use?', a6: 'Of course, it is perfect for businesses, influencers, and marketers.',
      q7: 'Does it require install?', a7: 'No, the system works entirely via the web without downloads.'
    },
    final: {
      placeholder: 'Post Link', wait: 'Wait', send: 'Send', sending: 'Sending...',
      toast: { success: 'Success', sent: 'Sent successfully', error: 'Alert', fill: 'Fill data', invalidFb: 'Invalid FB Link', oneEmoji: 'One emoji only', fail: 'Error sending', ok: 'OK', bot: 'Bot Detected' },
      msg: { req: 'Request', link: 'Link', react: 'React', visitor: 'Visitor' },
      ssl: 'SSL Secure'
    },
    shortener: {
        step1: "Step 1 of 3",
        step2: "Step 2 of 3",
        step3: "Step 3 of 3",
        prep: "Preparing your link...",
        wait: "Please Wait",
        ad: "Sponsored Ad",
        next: "Next Step",
        get: "Get Link",
        secure: "Secure Link",
        generating: "Generating Destination...",
        ready: "Link is Ready!"
    },
    security: { alert: 'Security Alert', desc: 'Action blocked for security reasons.' },
    incognito: { title: "Private Mode Detected", desc: "Please close Incognito mode to continue." },
    ban: { title: "Access Restricted", desc: "You have violated the site usage terms.", timer: "Lifted in:" },
    adblock: { title: "AdBlock Detected", desc: "Please disable AdBlock to continue." },
    shortenerPage: { title: "Direct Access Blocked", desc: "Please start from the home page." }
};

export const translations = {
  ar: AR_TRANSLATIONS,
  en: EN_TRANSLATIONS,
  es: { ...EN_TRANSLATIONS } as any,
  fr: { ...EN_TRANSLATIONS } as any,
  de: { ...EN_TRANSLATIONS } as any,
  ru: { ...EN_TRANSLATIONS } as any,
  zh: { ...EN_TRANSLATIONS } as any,
  pt: { ...EN_TRANSLATIONS } as any,
};

export type Lang = 'ar' | 'en' | 'es' | 'fr' | 'de' | 'ru' | 'zh' | 'pt';

interface User {
  id: string;
  name: string;
  email: string;
  password: string; 
  createdAt: number;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface AppContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  isAdmin: boolean;
  t: typeof EN_TRANSLATIONS;
}

// --- Contexts ---
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => false,
  signup: async () => false,
  loginWithGoogle: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export const AppContext = createContext<AppContextType>({
  lang: 'ar',
  setLang: () => {},
  toggleLang: () => {},
  isAdmin: false,
  t: AR_TRANSLATIONS,
});

// --- Auth Provider ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        // Check active session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const user: User = {
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User",
                    email: session.user.email || "",
                    password: "",
                    createdAt: Date.now()
                };
                setCurrentUser(user);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                 const user: User = {
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User",
                    email: session.user.email || "",
                    password: "",
                    createdAt: Date.now()
                };
                setCurrentUser(user);
                localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
            } else {
                setCurrentUser(null);
                localStorage.removeItem(AUTH_SESSION_KEY);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, pass: string): Promise<boolean> => {
        return true; 
    };

    const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
        return true;
    };

    const loginWithGoogle = async (): Promise<boolean> => {
        return true;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        localStorage.removeItem(AUTH_SESSION_KEY);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, signup, loginWithGoogle, logout, isAuthenticated: !!currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Hook ---
export const useAppConfig = () => {
    const authCtx = useContext(AuthContext);
    const appCtx = useContext(AppContext);
    return { ...authCtx, ...appCtx };
};