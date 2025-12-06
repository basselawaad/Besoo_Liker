import React, { createContext, useContext } from 'react';

// --- Telegram Configuration ---
export const TG_BOT_TOKEN = "8282477678:AAElPQVX-xemNjC79ojZfQLMpTxOzXXWRVE";
export const TG_CHAT_ID = "1838195482";

// --- Security Utilities ---
export const TIMER_KEY = "__sys_integrity_token_FINAL_v7"; 
export const BAN_KEY = "__sys_access_violation_FINAL_v7"; 
export const ADMIN_KEY = "__sys_root_privilege_token"; 
export const FINGERPRINT_KEY = "__sys_device_fp_v1";
const SALT = "besoo_secure_hash_x99_v4_ultra_strict"; 

// --- Centralized Telegram Logger ---
export const sendTelegramLog = async (status: 'BANNED' | 'GOOD_USER' | 'WARNING', reason: string, details: string = "") => {
    try {
        const logKey = `tg_log_sent_${status}_${reason.replace(/\s/g, '')}`;
        if (sessionStorage.getItem(logKey)) return; 

        const deviceId = await SecureStorage.generateFingerprint();
        const now = new Date().toLocaleString('ar-EG');
        
        let emoji = "✅";
        if (status === 'BANNED') emoji = "🚫";
        if (status === 'WARNING') emoji = "⚠️";

        const message = `🛡️ *نظام الحماية - Besoo Liker*\n\n` +
                        `${emoji} *الحالة:* ${status}\n` +
                        `📝 *السبب:* ${reason}\n` +
                        `📱 *بصمة الجهاز:* \`${deviceId}\`\n` +
                        `⏰ *التوقيت:* ${now}\n` +
                        `${details ? `📄 *تفاصيل:* ${details}` : ''}`;

        const params = new URLSearchParams({
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?${params.toString()}`, { mode: 'no-cors' });
        
        sessionStorage.setItem(logKey, 'true');
    } catch (e) {
        console.error("Log Error", e);
    }
};

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
  // --- Audio Fingerprinting ---
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

  // --- Advanced Fingerprinting ---
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

  // --- Strict Incognito Detection ---
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
      } catch (e) {
          return true;
      }

      try {
          localStorage.setItem('__test_incognito__', '1');
          localStorage.removeItem('__test_incognito__');
      } catch (e) {
          return true; 
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

// --- Translations ---
export const translations = {
  ar: {
    system: { loading: 'جاري تحميل النظام...', connect: 'جاري تهيئة الاتصال...', protection: 'نظام الحماية نشط', wait: 'يجب الانتظار قبل الطلب الجديد', copy: 'تم نسخ الرابط' },
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
    security: { alert: 'تنبيه أمني', desc: 'عذراً، هذا الإجراء غير مسموح به حفاظاً على الأمان.' },
    incognito: { title: "وضع التصفح الخفي مرفوض", desc: "لأسباب أمنية، يمنع استخدام الموقع في الوضع المتخفي (Incognito). يرجى فتح الموقع في متصفح عادي." },
    ban: { title: "تم حظر الوصول", desc: "لقد قمت بمخالفه استخدام الموقع", timer: "ينتهي الحظر خلال:" },
    adblock: { title: "تم كشف حظر الإعلانات", desc: "يرجى تعطيل AdBlock للمتابعة." },
    shortener: { title: "دخول غير مصرح به", desc: "يجب البدء من الصفحة الرئيسية." }
  },
  en: {
    system: { loading: 'LOADING SYSTEM...', connect: 'Connecting to Server...', protection: 'Protection System Active', wait: 'Wait before new request', copy: 'Link Copied' },
    header: { home: 'Home', contact: 'Contact Us', share: 'Share Website', shareTitle: 'Free Facebook Likes', shareText: '🚀 Best site to increase Facebook Likes for FREE! \n💯 100% Real & Safe Engagement \n🔒 No Password Required \nTry it now 👇' },
    footer: {
      privacy: 'Privacy Policy', rights: 'All rights reserved',
      modal: {
        title: 'Privacy & Security', introTitle: 'Introduction', introText: 'Welcome to Besoo Liker. We are committed to protecting your privacy.',
        collectTitle: 'Data Collection', collectText: 'We do not collect sensitive personal data. Only basic technical info is used.',
        securityTitle: 'Security', securityText: 'We use high-grade encryption for all communications.',
        disclaimerTitle: 'Disclaimer', disclaimerText: 'This tool is for educational purposes only.',
        agree: 'Using this tool means you agree to these terms.', close: 'Close'
      }
    },
    home: {
      title: 'Besoo Liker', subtitle: '100% Real & Safe', desc: 'Boost your posts with one click. Safe, fast, and supports all interactions.',
      instant: 'Instant', safe: 'Safe', start: 'Start Now', wow: 'WOW'
    },
    info: { 
      pageNum: 'Page 1 of 3', buttonReady: 'Proceed', buttonWait: 'Please Wait...',
      welcomeTitle: '⭐ Welcome', welcomeDesc: 'Smart tool to boost visibility.',
      featuresTitle: '🚀 Features', feat1Title: 'Instant', feat1Desc: 'Real reactions.',
      feat2Title: 'Security', feat2Desc: 'No password.', feat3Title: 'Easy', feat3Desc: 'Simple interface.'
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
      toast: { success: 'Success', sent: 'Sent successfully', error: 'Alert', fill: 'Fill data', invalidFb: 'Invalid FB Link', oneEmoji: 'One emoji only', fail: 'Error sending', ok: 'OK', bot: 'Bot Detected' },
      msg: { req: 'Request', link: 'Link', react: 'React', visitor: 'Visitor' },
      ssl: 'SSL Secure'
    },
    security: { alert: 'Security Alert', desc: 'Action blocked for security reasons.' },
    incognito: { title: "Private Mode Detected", desc: "Please close Incognito mode to continue." },
    ban: { title: "Access Restricted", desc: "You have violated the site usage terms.", timer: "Lifted in:" },
    adblock: { title: "Ad Blocker Detected", desc: "Please disable AdBlock to continue." },
    shortener: { title: "Direct Access Blocked", desc: "Please start from the home page." }
  },
  es: {
    system: { loading: 'CARGANDO SISTEMA...', connect: 'Conectando al servidor...', protection: 'Sistema de protección activo', wait: 'Espere antes de nueva solicitud', copy: 'Enlace copiado' },
    header: { home: 'Inicio', contact: 'Contacto', share: 'Compartir', shareTitle: 'Likes de Facebook Gratis', shareText: '🚀 ¡El mejor sitio para aumentar Likes de Facebook GRATIS! \n💯 100% Real y Seguro \n🔒 Sin Contraseña \nPruébalo ahora 👇' },
    footer: {
      privacy: 'Política de Privacidad', rights: 'Todos los derechos reservados',
      modal: { title: 'Privacidad y Seguridad', introTitle: 'Introducción', introText: 'Bienvenido a Besoo Liker.', collectTitle: 'Recolección de Datos', collectText: 'No recolectamos datos sensibles.', securityTitle: 'Seguridad', securityText: 'Usamos encriptación de alto nivel.', disclaimerTitle: 'Descargo', disclaimerText: 'Herramienta educativa.', agree: 'Al usar aceptas los términos.', close: 'Cerrar' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Real y Seguro', desc: 'Mejora tus publicaciones con un clic. Seguro y rápido.', instant: 'Instantáneo', safe: 'Seguro', start: 'Empezar', wow: 'WOW' },
    info: { pageNum: 'Página 1 de 3', buttonReady: 'Continuar', buttonWait: 'Espere...', welcomeTitle: '⭐ Bienvenido', welcomeDesc: 'Herramienta inteligente.', featuresTitle: '🚀 Características', feat1Title: 'Instantáneo', feat1Desc: 'Reacciones reales.', feat2Title: 'Seguridad', feat2Desc: 'Sin contraseña.', feat3Title: 'Fácil', feat3Desc: 'Interfaz simple.' },
    faq: { pageNum: 'Página 2 de 3', checking: 'Comprobando...', seconds: 's', buttonProceed: 'Continuar', buttonWait: 'Espere...', title: '🌐 ¿Cómo funciona?', step1Title: 'Sin Registro', step1Desc: 'Seguro.', step2Title: 'Elegir Post', step2Desc: 'Copiar enlace.', step3Title: 'Enviar', step3Desc: 'Elegir reacción.', step4Title: 'Resultados', step4Desc: 'Ver contador.' },
    timer: { finalStep: 'Paso Final', buttonGet: 'Continuar', buttonPrep: 'Cargando...', faqTitle: '💬 Preguntas', q1: '¿Seguro?', a1: 'Sí.', q2: '¿Real?', a2: 'Sí.', q3: '¿Gratis?', a3: 'Sí.', ready: '🔥 ¡Listo!' },
    final: { placeholder: 'Enlace del Post', wait: 'Espere', send: 'Enviar', sending: 'Enviando...', toast: { success: 'Éxito', sent: 'Enviado', error: 'Alerta', fill: 'Llenar datos', invalidFb: 'Enlace inválido', oneEmoji: 'Un emoji', fail: 'Error', ok: 'OK', bot: 'Bot detectado' }, msg: { req: 'Solicitud', link: 'Enlace', react: 'Reacción', visitor: 'Visitante' }, ssl: 'SSL Seguro' },
    security: { alert: 'Alerta de Seguridad', desc: 'Acción bloqueada.' },
    incognito: { title: "Modo Privado Detectado", desc: "Cierre el modo incógnito." },
    ban: { title: "Acceso Restringido", desc: "Has violado los términos de uso del sitio.", timer: "Se levanta en:" },
    adblock: { title: "AdBlock Detectado", desc: "Desactive AdBlock." },
    shortener: { title: "Acceso Directo Bloqueado", desc: "Inicie desde el inicio." }
  },
  fr: {
    system: { loading: 'CHARGEMENT...', connect: 'Connexion au serveur...', protection: 'Protection active', wait: 'Attendez avant nouvelle demande', copy: 'Lien copié' },
    header: { home: 'Accueil', contact: 'Contact', share: 'Partager', shareTitle: 'Likes Facebook Gratuits', shareText: '🚀 Le meilleur site pour augmenter les Likes Facebook GRATUITEMENT ! \n💯 100% Réel & Sécurisé \n🔒 Sans mot de passe \nEssayez maintenant 👇' },
    footer: {
      privacy: 'Confidentialité', rights: 'Tous droits réservés',
      modal: { title: 'Confidentialité', introTitle: 'Intro', introText: 'Bienvenue sur Besoo Liker.', collectTitle: 'Données', collectText: 'Pas de données sensibles.', securityTitle: 'Sécurité', securityText: 'Chiffrement fort.', disclaimerTitle: 'Avis', disclaimerText: 'Éducatif.', agree: 'Accord.', close: 'Fermer' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Réel & Sécurisé', desc: 'Boostez vos posts en un clic.', instant: 'Instantané', safe: 'Sûr', start: 'Commencer', wow: 'WOW' },
    info: { pageNum: 'Page 1 sur 3', buttonReady: 'Continuer', buttonWait: 'Attendez...', welcomeTitle: '⭐ Bienvenue', welcomeDesc: 'Outil intelligent.', featuresTitle: '🚀 Fonctions', feat1Title: 'Instantané', feat1Desc: 'Réel.', feat2Title: 'Sécurité', feat2Desc: 'Sans MDP.', feat3Title: 'Facile', feat3Desc: 'Simple.' },
    faq: { pageNum: 'Page 2 sur 3', checking: 'Vérification...', seconds: 's', buttonProceed: 'Continuer', buttonWait: 'Attendez...', title: '🌐 Comment ça marche ?', step1Title: 'Pas d\'inscription', step1Desc: 'Sûr.', step2Title: 'Choisir Post', step2Desc: 'Copier lien.', step3Title: 'Envoyer', step3Desc: 'Choisir réaction.', step4Title: 'Résultats', step4Desc: 'Voir compteur.' },
    timer: { finalStep: 'Dernière étape', buttonGet: 'Continuer', buttonPrep: 'Chargement...', faqTitle: '💬 FAQ', q1: 'Sûr ?', a1: 'Oui.', q2: 'Réel ?', a2: 'Oui.', q3: 'Gratuit ?', a3: 'Oui.', ready: '🔥 Prêt !' },
    final: { placeholder: 'Lien du Post', wait: 'Attendez', send: 'Envoyer', sending: 'Envoi...', toast: { success: 'Succès', sent: 'Envoyé', error: 'Alerte', fill: 'Remplir', invalidFb: 'Lien invalide', oneEmoji: 'Un emoji', fail: 'Erreur', ok: 'OK', bot: 'Bot détecté' }, msg: { req: 'Demande', link: 'Lien', react: 'Réact', visitor: 'Visiteur' }, ssl: 'SSL Sécurisé' },
    security: { alert: 'Alerte Sécurité', desc: 'Action bloquée.' },
    incognito: { title: "Mode Privé Détecté", desc: "Fermez le mode incognito." },
    ban: { title: "Accès Restreint", desc: "Vous avez violé les conditions d'utilisation.", timer: "Levé dans :" },
    adblock: { title: "AdBlock Détecté", desc: "Désactivez AdBlock." },
    shortener: { title: "Accès Direct Bloqué", desc: "Commencez par l'accueil." }
  },
  de: {
    system: { loading: 'SYSTEM LÄDT...', connect: 'Verbinde zum Server...', protection: 'Schutzsystem aktiv', wait: 'Warten vor neuer Anfrage', copy: 'Link kopiert' },
    header: { home: 'Start', contact: 'Kontakt', share: 'Teilen', shareTitle: 'Kostenlose Facebook Likes', shareText: '🚀 Beste Seite für kostenlose Facebook Likes! \n💯 100% Echt & Sicher \n🔒 Kein Passwort \nJetzt testen 👇' },
    footer: {
      privacy: 'Datenschutz', rights: 'Alle Rechte vorbehalten',
      modal: { title: 'Datenschutz', introTitle: 'Intro', introText: 'Willkommen bei Besoo Liker.', collectTitle: 'Daten', collectText: 'Keine sensiblen Daten.', securityTitle: 'Sicherheit', securityText: 'Verschlüsselung.', disclaimerTitle: 'Haftung', disclaimerText: 'Bildung.', agree: 'Zustimmung.', close: 'Schließen' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Echt & Sicher', desc: 'Booste deine Beiträge.', instant: 'Sofort', safe: 'Sicher', start: 'Starten', wow: 'WOW' },
    info: { pageNum: 'Seite 1 von 3', buttonReady: 'Weiter', buttonWait: 'Warten...', welcomeTitle: '⭐ Willkommen', welcomeDesc: 'Intelligentes Tool.', featuresTitle: '🚀 Funktionen', feat1Title: 'Sofort', feat1Desc: 'Echt.', feat2Title: 'Sicherheit', feat2Desc: 'Kein PW.', feat3Title: 'Einfach', feat3Desc: 'Simpel.' },
    faq: { pageNum: 'Seite 2 von 3', checking: 'Prüfen...', seconds: 's', buttonProceed: 'Weiter', buttonWait: 'Warten...', title: '🌐 Wie geht es?', step1Title: 'Keine Anmeldung', step1Desc: 'Sicher.', step2Title: 'Post wählen', step2Desc: 'Link kopieren.', step3Title: 'Senden', step3Desc: 'Reaktion wählen.', step4Title: 'Ergebnisse', step4Desc: 'Zähler sehen.' },
    timer: { finalStep: 'Letzter Schritt', buttonGet: 'Weiter', buttonPrep: 'Laden...', faqTitle: '💬 FAQ', q1: 'Sicher?', a1: 'Ja.', q2: 'Echt?', a2: 'Ja.', q3: 'Gratis?', a3: 'Ja.', ready: '🔥 Bereit!' },
    final: { placeholder: 'Beitrags-Link', wait: 'Warten', send: 'Senden', sending: 'Senden...', toast: { success: 'Erfolg', sent: 'Gesendet', error: 'Alarm', fill: 'Ausfüllen', invalidFb: 'Ungültiger Link', oneEmoji: 'Ein Emoji', fail: 'Fehler', ok: 'OK', bot: 'Bot erkannt' }, msg: { req: 'Anfrage', link: 'Link', react: 'Reakt', visitor: 'Besucher' }, ssl: 'SSL Sicher' },
    security: { alert: 'Sicherheitsalarm', desc: 'Aktion blockiert.' },
    incognito: { title: "Privatmodus Erkannt", desc: "Schließe Inkognito." },
    ban: { title: "Zugriff verweigert", desc: "Sie haben gegen die Nutzungsbedingungen verstoßen.", timer: "Endet in:" },
    adblock: { title: "AdBlock Erkannt", desc: "AdBlock deaktivieren." },
    shortener: { title: "Direktzugriff Blockiert", desc: "Starte von vorne." }
  },
  ru: {
    system: { loading: 'ЗАГРУЗКА...', connect: 'Подключение...', protection: 'Защита активна', wait: 'Подождите перед запросом', copy: 'Ссылка скопирована' },
    header: { home: 'Главная', contact: 'Контакты', share: 'Поделиться', shareTitle: 'Бесплатные лайки FB', shareText: '🚀 Лучший сайт для бесплатных лайков Facebook! \n💯 100% Реально \n🔒 Без пароля \nПопробуй сейчас 👇' },
    footer: {
      privacy: 'Конфиденциальность', rights: 'Все права защищены',
      modal: { title: 'Безопасность', introTitle: 'Введение', introText: 'Добро пожаловать.', collectTitle: 'Данные', collectText: 'Без личных данных.', securityTitle: 'Защита', securityText: 'Шифрование.', disclaimerTitle: 'Отказ', disclaimerText: 'Образование.', agree: 'Согласие.', close: 'Закрыть' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Реально', desc: 'Продвигай посты.', instant: 'Мгновенно', safe: 'Безопасно', start: 'Начать', wow: 'WOW' },
    info: { pageNum: 'Стр 1 из 3', buttonReady: 'Далее', buttonWait: 'Ждите...', welcomeTitle: '⭐ Привет', welcomeDesc: 'Умный инструмент.', featuresTitle: '🚀 Фишки', feat1Title: 'Быстро', feat1Desc: 'Реально.', feat2Title: 'Защита', feat2Desc: 'Без пароля.', feat3Title: 'Просто', feat3Desc: 'Легко.' },
    faq: { pageNum: 'Стр 2 из 3', checking: 'Проверка...', seconds: 'с', buttonProceed: 'Далее', buttonWait: 'Ждите...', title: '🌐 Как работает?', step1Title: 'Без регистр.', step1Desc: 'Безопасно.', step2Title: 'Выбрать пост', step2Desc: 'Копия ссылки.', step3Title: 'Отправить', step3Desc: 'Выбрать реакцию.', step4Title: 'Итог', step4Desc: 'Смотреть.' },
    timer: { finalStep: 'Финал', buttonGet: 'Далее', buttonPrep: 'Загрузка...', faqTitle: '💬 FAQ', q1: 'Безопасно?', a1: 'Да.', q2: 'Реально?', a2: 'Да.', q3: 'Бесплатно?', a3: 'Да.', ready: '🔥 Готово!' },
    final: { placeholder: 'Ссылка', wait: 'Ждите', send: 'Отправить', sending: 'Отправка...', toast: { success: 'Успех', sent: 'Отправлено', error: 'Тревога', fill: 'Заполните', invalidFb: 'Неверная ссылка', oneEmoji: 'Один эмодзи', fail: 'Ошибка', ok: 'ОК', bot: 'Бот' }, msg: { req: 'Запрос', link: 'Ссылка', react: 'Реакт', visitor: 'Гость' }, ssl: 'SSL Защита' },
    security: { alert: 'Тревога', desc: 'Действие заблокировано.' },
    incognito: { title: "Инкогнито", desc: "Закройте инкогнито." },
    ban: { title: "Доступ закрыт", desc: "Вы нарушили правила использования.", timer: "Снятие через:" },
    adblock: { title: "AdBlock", desc: "Выключите AdBlock." },
    shortener: { title: "Блокировка", desc: "Начните с главной." }
  },
  zh: {
    system: { loading: '系统加载中...', connect: '连接服务器...', protection: '保护系统激活', wait: '请求前请稍候', copy: '链接已复制' },
    header: { home: '首页', contact: '联系', share: '分享', shareTitle: '免费 Facebook 点赞', shareText: '🚀 最好的免费 Facebook 点赞网站！ \n💯 100% 真实安全 \n🔒 无需密码 \n立即尝试 👇' },
    footer: {
      privacy: '隐私政策', rights: '版权所有',
      modal: { title: '隐私与安全', introTitle: '介绍', introText: '欢迎来到 Besoo Liker。', collectTitle: '数据', collectText: '不收集敏感数据。', securityTitle: '安全', securityText: '强加密。', disclaimerTitle: '声明', disclaimerText: '教育用途。', agree: '同意条款。', close: '关闭' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% 真实安全', desc: '一键提升。', instant: '即时', safe: '安全', start: '开始', wow: '哇' },
    info: { pageNum: '第 1 页，共 3 页', buttonReady: '继续', buttonWait: '请稍候...', welcomeTitle: '⭐ 欢迎', welcomeDesc: '智能工具。', featuresTitle: '🚀 特点', feat1Title: '即时', feat1Desc: '真实。', feat2Title: '安全', feat2Desc: '无密码。', feat3Title: '简单', feat3Desc: '易用。' },
    faq: { pageNum: '第 2 页，共 3 页', checking: '检查中...', seconds: '秒', buttonProceed: '继续', buttonWait: '请稍候...', title: '🌐 如何运作？', step1Title: '免注册', step1Desc: '安全。', step2Title: '选帖', step2Desc: '复制链接。', step3Title: '发送', step3Desc: '选反应。', step4Title: '结果', step4Desc: '看计数。' },
    timer: { finalStep: '最后一步', buttonGet: '继续', buttonPrep: '加载中...', faqTitle: '💬 常见问题', q1: '安全吗？', a1: '是。', q2: '真实吗？', a2: '是。', q3: '免费吗？', a3: '是。', ready: '🔥 准备就绪！' },
    final: { placeholder: '帖子链接', wait: '等待', send: '发送', sending: '发送中...', toast: { success: '成功', sent: '已发送', error: '警告', fill: '填写数据', invalidFb: '无效链接', oneEmoji: '仅一个表情', fail: '错误', ok: '确定', bot: '检测到机器人' }, msg: { req: '请求', link: '链接', react: '反应', visitor: '访客' }, ssl: 'SSL 安全' },
    security: { alert: '安全警告', desc: '操作被阻止。' },
    incognito: { title: "检测到隐私模式", desc: "请关闭隐私模式。" },
    ban: { title: "访问受限", desc: "您违反了网站使用条款。", timer: "解封倒计时：" },
    adblock: { title: "检测到广告拦截", desc: "请关闭广告拦截。" },
    shortener: { title: "直接访问被阻", desc: "请从首页开始。" }
  },
  pt: {
    system: { loading: 'CARREGANDO...', connect: 'Conectando...', protection: 'Proteção Ativa', wait: 'Aguarde...', copy: 'Link Copiado' },
    header: { home: 'Início', contact: 'Contato', share: 'Compartilhar', shareTitle: 'Likes Grátis', shareText: '🚀 Melhor site para Likes no Facebook GRÁTIS! \n💯 100% Real \n🔒 Sem Senha \nTente agora 👇' },
    footer: {
      privacy: 'Privacidade', rights: 'Todos os direitos reservados',
      modal: { title: 'Privacidade', introTitle: 'Intro', introText: 'Bem-vindo.', collectTitle: 'Dados', collectText: 'Sem dados sensíveis.', securityTitle: 'Segurança', securityText: 'Criptografia.', disclaimerTitle: 'Aviso', disclaimerText: 'Educacional.', agree: 'Concordo.', close: 'Fechar' }
    },
    home: { title: 'Besoo Liker', subtitle: '100% Real e Seguro', desc: 'Impulsione agora.', instant: 'Instantâneo', safe: 'Seguro', start: 'Começar', wow: 'WOW' },
    info: { pageNum: 'Pág 1 de 3', buttonReady: 'Continuar', buttonWait: 'Aguarde...', welcomeTitle: '⭐ Bem-vindo', welcomeDesc: 'Ferramenta inteligente.', featuresTitle: '🚀 Recursos', feat1Title: 'Rápido', feat1Desc: 'Real.', feat2Title: 'Segurança', feat2Desc: 'Sem senha.', feat3Title: 'Fácil', feat3Desc: 'Simples.' },
    faq: { pageNum: 'Pág 2 de 3', checking: 'Verificando...', seconds: 's', buttonProceed: 'Continuar', buttonWait: 'Aguarde...', title: '🌐 Como funciona?', step1Title: 'Sem Cadastro', step1Desc: 'Seguro.', step2Title: 'Escolher Post', step2Desc: 'Copiar link.', step3Title: 'Enviar', step3Desc: 'Escolher reação.', step4Title: 'Resultados', step4Desc: 'Ver contador.' },
    timer: { finalStep: 'Final', buttonGet: 'Continuar', buttonPrep: 'Carregando...', faqTitle: '💬 FAQ', q1: 'Seguro?', a1: 'Sim.', q2: 'Real?', a2: 'Sim.', q3: 'Grátis?', a3: 'Sim.', ready: '🔥 Pronto!' },
    final: { placeholder: 'Link do Post', wait: 'Aguarde', send: 'Enviar', sending: 'Enviando...', toast: { success: 'Sucesso', sent: 'Enviado', error: 'Alerta', fill: 'Preencher', invalidFb: 'Link inválido', oneEmoji: 'Um emoji', fail: 'Erro', ok: 'OK', bot: 'Bot detectado' }, msg: { req: 'Pedido', link: 'Link', react: 'Reação', visitor: 'Visitante' }, ssl: 'SSL Seguro' },
    security: { alert: 'Alerta', desc: 'Ação bloqueada.' },
    incognito: { title: "Modo Privado", desc: "Feche o modo privado." },
    ban: { title: "Acesso Restrito", desc: "Você violou os termos de uso do site.", timer: "Liberado em:" },
    adblock: { title: "AdBlock Detectado", desc: "Desative o AdBlock." },
    shortener: { title: "Acesso Direto Bloq.", desc: "Comece do início." }
  },
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