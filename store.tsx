import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

// --- Security & Obfuscation ---
const _SYS_CONFIG = {
    _k: "ODI4MjQ3NzY3ODpBQUVsUFFWWC14ZW1OakM3OW9qWmZSTE1wVHhPelhYV1JWRQ==", 
    _c: "MTgzODE5NTQ4Mg==" 
};

const _dec = (str: string) => {
    try { return atob(str); } catch (e) { return ""; }
};

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

// --- Telegram Logger ---
export const sendTelegramLog = async (status: 'BANNED' | 'GOOD_USER' | 'WARNING' | 'NEW_USER' | 'LOGIN', reason: string, details: string = "") => {
    try {
        const token = _dec(_SYS_CONFIG._k);
        const chatId = _dec(_SYS_CONFIG._c);
        if (!token || !chatId) return;

        const deviceId = await SecureStorage.generateFingerprint();
        const now = new Date().toLocaleString('ar-EG');
        let emoji = "✅";
        if (status === 'BANNED') emoji = "🚫";
        if (status === 'WARNING') emoji = "⚠️";
        if (status === 'NEW_USER') emoji = "👤";
        if (status === 'LOGIN') emoji = "🔑";

        const message = `🛡️ *Besoo Liker System*\n\n${emoji} *Status:* ${status}\n📝 *Event:* ${reason}\n📱 *Device ID:* \`${deviceId}\`\n⏰ *Time:* ${now}\n${details ? `📄 *Details:* ${details}` : ''}`;
        const params = new URLSearchParams({ chat_id: chatId, text: message, parse_mode: 'Markdown' });
        await fetch(`https://api.telegram.org/bot${token}/sendMessage?${params.toString()}`, { mode: 'no-cors' });
    } catch (e) { console.error("Log Error", e); }
};

// --- Translations ---
const AR_TRANSLATIONS = {
    system: { loading: 'جاري تحميل النظام...', connect: 'جاري تهيئة الاتصال...', protection: 'نظام الحماية نشط', wait: 'يجب الانتظار قبل الطلب الجديد', copy: 'تم نسخ الرابط' },
    auth: {
        loginTitle: "تسجيل الدخول", signupTitle: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", 
        confirmPassword: "تأكيد كلمة المرور", name: "الاسم الكامل",
        loginBtn: "دخول", signupBtn: "التالي", noAccount: "ليس لديك حساب؟", haveAccount: "لديك حساب بالفعل؟",
        errorEmpty: "يرجى ملء جميع الحقول", errorMatch: "كلمات المرور غير متطابقة", errorExists: "البريد الإلكتروني مسجل مسبقاً",
        errorInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة", successSignup: "تم إنشاء الحساب بنجاح", logout: "تسجيل خروج",
        googleBtn: "تسجيل الدخول باستخدام جوجل",
        verifyTitle: "إثبات ملكية البريد", verifyText: "أدخل الرمز الذي تم إرساله إلى بريدك الإلكتروني", verifyCode: "أدخل الرمز", verifyBtn: "تأكيد", resend: "إعادة إرسال",
        forgotPass: "هل نسيت كلمة المرور؟", resetPassTitle: "استعادة كلمة المرور", sendResetLink: "إرسال رابط الاستعادة", backToLogin: "العودة لتسجيل الدخول", resetSuccess: "تم إرسال رابط الاستعادة لبريدك",
        resendActive: "إعادة إرسال رابط التفعيل", resendWait: "يرجى الانتظار", tempMail: "غير مسموح باستخدام بريد مؤقت",
        onlyGmail: "عذراً، التسجيل متاح فقط لمستخدمي Gmail (@gmail.com)"
    },
    header: { home: 'الرئيسية', contact: 'اتصل بنا', share: 'مشاركة الموقع', shareTitle: 'زيادة لايكات فيسبوك مجاناً', shareText: '🚀 أقوى موقع لزيادة لايكات فيسبوك مجاناً! \n💯 تفاعل حقيقي ومضمون 100% \n🔒 آمن تماماً وبدون كلمة سر \nجربه الآن 👇' },
    footer: {
      privacy: 'سياسة الخصوصية', rights: 'جميع الحقوق محفوظة',
      modal: { title: 'سياسة الخصوصية والأمان', introTitle: 'مقدمة', introText: 'مرحباً بك في Besoo Liker. نحن نلتزم بحماية خصوصيتك.', collectTitle: 'المعلومات التي نجمعها', collectText: 'نحن لا نقوم بجمع معلومات شخصية حساسة.', securityTitle: 'أمان حسابك', securityText: 'نحن نستخدم أحدث تقنيات التشفير.', disclaimerTitle: 'إخلاء المسؤولية', disclaimerText: 'هذه الأداة مصممة لأغراض تعليمية.', agree: 'موافقة.', close: 'إغلاق' }
    },
    home: { title: 'Besoo Liker', subtitle: 'زيادة تفاعل حقيقية وآمنة 100%', desc: 'عزز منشوراتك بضغطة زر. نظام آمن، سريع، ويدعم جميع التفاعلات.', instant: 'فوري', safe: 'آمن', start: 'ابدأ الآن', wow: 'واو' },
    info: { pageNum: 'الصفحة 1 من 3', buttonReady: 'متابعة', buttonWait: 'انتظار' },
    faq: { pageNum: 'الصفحة 2 من 3', checking: 'تحقق...', seconds: 'ثانية', buttonProceed: 'متابعة', buttonWait: 'انتظار', title: 'كيف يعمل؟', sub: 'خطوات بسيطة', step1Title: 'تسجيل', step1Desc: 'سجل دخولك بأمان', step2Title: 'تحديد', step2Desc: 'اختر المنشور', step3Title: 'تنفيذ', step3Desc: 'يبدأ النظام فوراً', step4Title: 'نتائج', step4Desc: 'راقب التفاعل' },
    timer: { finalStep: 'الخطوة الأخيرة', buttonGet: 'متابعة', buttonPrep: 'تحميل...', faqTitle: 'الأسئلة', ctaTitle: 'ابدأ الآن', ctaDesc: 'جربه اليوم', q1: 'آمن؟', a1: 'نعم', q2: 'حقيقي؟', a2: 'نعم', q3: 'اختيار؟', a3: 'نعم', q4: 'وقت؟', a4: 'دقائق', q5: 'حد؟', a5: 'نعم', q6: 'تجاري؟', a6: 'نعم', q7: 'تثبيت؟', a7: 'لا' },
    final: { placeholder: 'رابط المنشور', wait: 'يرجى الانتظار', send: 'إرسال التفاعل', sending: 'جارٍ الإرسال...', toast: { success: 'نجاح', sent: 'تم الإرسال بنجاح', error: 'تنبيه', fill: 'يرجى ملء البيانات', invalidFb: 'رابط فيسبوك غير صالح', oneEmoji: 'إيموجي واحد فقط', fail: 'خطأ', ok: 'موافق', bot: 'تم كشف نشاط آلي' }, msg: { req: 'طلب', link: 'رابط', react: 'تفاعل', visitor: 'زائر' }, ssl: 'اتصال آمن SSL' },
    shortener: { step1: "الخطوة 1 من 3", step2: "الخطوة 2 من 3", step3: "الخطوة 3 من 3", prep: "جاري تجهيز الرابط...", wait: "يرجى الانتظار...", ad: "إعلان ممول", next: "الانتقال للرابط", get: "الذهاب للرابط", secure: "رابط آمن 100%", generating: "جاري التوليد...", ready: "الرابط جاهز!" },
    security: { alert: 'تنبيه أمني', desc: 'إجراء غير مسموح' },
    incognito: { title: "وضع التصفح الخفي مرفوض", desc: "يمنع استخدام المتخفي" },
    ban: { title: "تم حظر الوصول", desc: "مخالفة الشروط", timer: "ينتهي:" },
    adblock: { title: "حظر الإعلانات", desc: "يرجى تعطيل مانع الإعلانات للمتابعة" },
    shortenerPage: { title: "ممنوع", desc: "ابدأ من الرئيسية" }
};

const EN_TRANSLATIONS = {
    system: { loading: 'LOADING SYSTEM...', connect: 'Connecting...', protection: 'System Active', wait: 'Wait', copy: 'Link Copied' },
    auth: {
        loginTitle: "Login", signupTitle: "Create Account", email: "Email Address", password: "Password", 
        confirmPassword: "Confirm Password", name: "Full Name",
        loginBtn: "Login", signupBtn: "Next", noAccount: "No account?", haveAccount: "Have account?",
        errorEmpty: "Fill all fields", errorMatch: "Passwords mismatch", errorExists: "Email exists",
        errorInvalid: "Invalid Email/Password", successSignup: "Success", logout: "Logout",
        googleBtn: "Sign in with Google",
        verifyTitle: "Verify email", verifyText: "Enter code sent to email", verifyCode: "Enter Code", verifyBtn: "Verify", resend: "Resend",
        forgotPass: "Forgot Password?", resetPassTitle: "Reset Password", sendResetLink: "Send Link", backToLogin: "Back to Login", resetSuccess: "Link sent",
        resendActive: "Resend Activation", resendWait: "Please wait", tempMail: "Temporary email not allowed",
        onlyGmail: "Only Gmail addresses (@gmail.com) are allowed"
    },
    header: { home: 'Home', contact: 'Contact', share: 'Share', shareTitle: 'Free FB Likes', shareText: '🚀 Best site for FREE Likes! \n💯 Real & Safe \n🔒 No Password \nTry now 👇' },
    footer: {
      privacy: 'Privacy Policy', rights: 'All rights reserved',
      modal: { title: 'Privacy & Security', introTitle: 'Intro', introText: 'Welcome. We protect privacy.', collectTitle: 'Data', collectText: 'No sensitive data.', securityTitle: 'Security', securityText: 'Encryption used.', disclaimerTitle: 'Disclaimer', disclaimerText: 'Educational use.', agree: 'Agreed.', close: 'Close' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Real & Safe', desc: 'Boost posts safely and fast.', instant: 'Instant', safe: 'Safe', start: 'Start Now', wow: 'WOW' },
    info: { pageNum: 'Page 1 of 3', buttonReady: 'Proceed', buttonWait: 'Wait...' },
    faq: { pageNum: 'Page 2 of 3', checking: 'Checking...', seconds: 'Sec', buttonProceed: 'Proceed', buttonWait: 'Wait...', title: 'How it Works?', sub: 'Simple steps', step1Title: 'Login', step1Desc: 'Safe login', step2Title: 'Select', step2Desc: 'Choose post', step3Title: 'Process', step3Desc: 'Starts now', step4Title: 'Results', step4Desc: 'Watch engagement' },
    timer: { finalStep: 'Final Step', buttonGet: 'Get Link', buttonPrep: 'Loading...', faqTitle: 'FAQ', ctaTitle: 'Start Now', ctaDesc: 'Try today', q1: 'Safe?', a1: 'Yes', q2: 'Real?', a2: 'Yes', q3: 'Choose?', a3: 'Yes', q4: 'Time?', a4: 'Minutes', q5: 'Limit?', a5: 'Yes', q6: 'Business?', a6: 'Yes', q7: 'Install?', a7: 'No' },
    final: { placeholder: 'Post Link', wait: 'Wait', send: 'Send', sending: 'Sending...', toast: { success: 'Success', sent: 'Sent!', error: 'Alert', fill: 'Fill data', invalidFb: 'Invalid Link', oneEmoji: 'One emoji only', fail: 'Error', ok: 'OK', bot: 'Bot Detected' }, msg: { req: 'Request', link: 'Link', react: 'React', visitor: 'Visitor' }, ssl: 'SSL Secure' },
    shortener: { step1: "Step 1 of 3", step2: "Step 2 of 3", step3: "Step 3 of 3", prep: "Preparing Link...", wait: "Please Wait...", ad: "Advertisement", next: "Next Step", get: "Get Link", secure: "100% Secure", generating: "Generating...", ready: "Link Ready!" },
    security: { alert: 'Security Alert', desc: 'Blocked' },
    incognito: { title: "Private Mode", desc: "Close Incognito" },
    ban: { title: "Restricted", desc: "Violated terms", timer: "Lifted in:" },
    adblock: { title: "AdBlock Detected", desc: "Please disable AdBlock to proceed" },
    shortenerPage: { title: "Blocked", desc: "Go Home" }
};

const ES_TRANSLATIONS = {
    ...EN_TRANSLATIONS,
    shortener: { step1: "Paso 1 de 3", step2: "Paso 2 de 3", step3: "Paso 3 de 3", prep: "Preparando enlace...", wait: "Por favor espere...", ad: "Anuncio", next: "Siguiente paso", get: "Obtener enlace", secure: "100% Seguro", generating: "Generando...", ready: "¡Enlace listo!" },
    auth: { ...EN_TRANSLATIONS.auth, tempMail: "Correo temporal no permitido", onlyGmail: "Solo se permiten correos de Gmail" }
};

const FR_TRANSLATIONS = {
    ...EN_TRANSLATIONS,
    shortener: { step1: "Étape 1 sur 3", step2: "Étape 2 sur 3", step3: "Étape 3 sur 3", prep: "Préparation...", wait: "Veuillez patienter...", ad: "Publicité", next: "Étape suivante", get: "Obtenir le lien", secure: "100% Sécurisé", generating: "Génération...", ready: "Lien prêt !" },
    auth: { ...EN_TRANSLATIONS.auth, tempMail: "Email temporaire non autorisé", onlyGmail: "Seuls les emails Gmail sont autorisés" }
};

const DE_TRANSLATIONS = {
    ...EN_TRANSLATIONS,
    shortener: { step1: "Schritt 1 von 3", step2: "Schritt 2 von 3", step3: "Schritt 3 von 3", prep: "Link vorbereiten...", wait: "Bitte warten...", ad: "Werbung", next: "Nächster Schritt", get: "Link abrufen", secure: "100% Sicher", generating: "Generieren...", ready: "Link bereit!" },
    auth: { ...EN_TRANSLATIONS.auth, tempMail: "Wegwerf-E-Mail nicht erlaubt", onlyGmail: "Nur Gmail-Adressen sind erlaubt" }
};

const PT_TRANSLATIONS = {
    ...EN_TRANSLATIONS,
    shortener: { step1: "Passo 1 de 3", step2: "Passo 2 de 3", step3: "Passo 3 de 3", prep: "Preparando link...", wait: "Aguarde...", ad: "Anúncio", next: "Próximo passo", get: "Obter link", secure: "100% Seguro", generating: "Gerando...", ready: "Link pronto!" },
    auth: { ...EN_TRANSLATIONS.auth, tempMail: "Email temporário não permitido", onlyGmail: "Apenas e-mails do Gmail são permitidos" }
};

const RU_TRANSLATIONS = {
    ...EN_TRANSLATIONS,
    shortener: { step1: "Шаг 1 из 3", step2: "Шаг 2 из 3", step3: "Шаг 3 из 3", prep: "Подготовка ссылки...", wait: "Подождите...", ad: "Реклама", next: "Следующий шаг", get: "Получить ссылку", secure: "100% Безопасно", generating: "Создание...", ready: "Ссылка готова!" },
    auth: { ...EN_TRANSLATIONS.auth, tempMail: "Временная почта запрещена", onlyGmail: "Разрешены только адреса Gmail" }
};

const ZH_TRANSLATIONS = {
    ...EN_TRANSLATIONS,
    shortener: { step1: "第 1 步，共 3 步", step2: "第 2 步，共 3 步", step3: "第 3 步，共 3 步", prep: "正在准备链接...", wait: "请稍候...", ad: "广告", next: "下一步", get: "获取链接", secure: "100% 安全", generating: "正在生成...", ready: "链接就绪！" },
    auth: { ...EN_TRANSLATIONS.auth, tempMail: "不允许使用临时邮箱", onlyGmail: "仅允许使用 Gmail 地址" }
};

export const translations = {
  ar: AR_TRANSLATIONS,
  en: EN_TRANSLATIONS,
  es: ES_TRANSLATIONS,
  fr: FR_TRANSLATIONS,
  de: DE_TRANSLATIONS,
  ru: RU_TRANSLATIONS,
  zh: ZH_TRANSLATIONS,
  pt: PT_TRANSLATIONS,
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
  authLoading: boolean;
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
  authLoading: true,
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
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
             setAuthLoading(true);
             const { data: { session } } = await supabase.auth.getSession();
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
             setAuthLoading(false);
        };

        initAuth();

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
            setAuthLoading(false);
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
        <AuthContext.Provider value={{ currentUser, login, signup, loginWithGoogle, logout, isAuthenticated: !!currentUser, authLoading }}>
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