import React, { createContext, useContext } from 'react';

// --- Security Utilities ---
// تحديث المفاتيح لنسخة (V5 Amnesty) - عفو عام، ولكن القوانين سارية
export const TIMER_KEY = "__sys_integrity_token_FINAL_v5"; 
export const BAN_KEY = "__sys_access_violation_FINAL_v5"; 
export const ADMIN_KEY = "__sys_root_privilege_token"; 
const SALT = "besoo_secure_hash_x99_v3_ultra"; 

export class SecureStorage {
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
    // إذا كان أدمن، لا تقم بحفظ وقت الانتظار أصلاً
    if (SecureStorage.isAdmin()) return;

    const encrypted = SecureStorage.encrypt(value);
    localStorage.setItem(TIMER_KEY, encrypted);
    document.cookie = `${TIMER_KEY}=${encrypted}; path=/; max-age=86400; SameSite=Strict`;
  }

  static getItem(): string | null {
    if (typeof window === 'undefined') return null;
    // تجاوز كامل للعداد إذا كان المستخدم أدمن
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

  static setBan(timestamp: number) {
      if (typeof window === 'undefined') return;
      if (SecureStorage.isAdmin()) return;

      const encrypted = SecureStorage.encrypt(timestamp.toString());
      localStorage.setItem(BAN_KEY, encrypted);
      document.cookie = `${BAN_KEY}=${encrypted}; path=/; max-age=86400; SameSite=Strict`;
  }

  static getBan(): number | null {
      if (typeof window === 'undefined') return null;
      if (SecureStorage.isAdmin()) return null;

      let val = localStorage.getItem(BAN_KEY);
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
    incognito: { title: "Private Mode", desc: "Close Incognito." },
    ban: { title: "Access Restricted", desc: "Suspicious activity detected.", timer: "Lifted in:" },
    adblock: { title: "AdBlock Detected", desc: "Disable AdBlock." },
    shortener: { title: "Traffic Source Blocked", desc: "Access via URL shorteners (Bitly, Cutly, etc.) is prohibited to prevent abuse. Please open the site directly." }
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
        title: "تم كشف الوضع المتخفي",
        desc: "يرجى إغلاق الوضع المتخفي (Incognito) واستخدام المتصفح العادي لضمان حفظ وقت العداد بشكل صحيح."
    },
    ban: {
        title: "تم حظر الوصول",
        desc: "تم اكتشاف نشاط مريب. لقد حاولت نسخ الرابط أو تخطي خطوات النظام الإجبارية.",
        timer: "ينتهي الحظر خلال:"
    },
    adblock: {
        title: "تم كشف مانع الإعلانات",
        desc: "نظامنا اكتشف أنك تستخدم مانع إعلانات (AdBlock). يرجى تعطيله للمتابعة واستخدام الخدمة المجانية بشكل آمن."
    },
    shortener: {
        title: "رابط خارجي محظور",
        desc: "يمنع الدخول عبر روابط مختصرة (مثل Bitly وغيرها) لتجنب التحايل. يرجى استخدام الرابط الأصلي للموقع."
    }
  },
  en: defaultEn,
  es: { 
      ...defaultEn, 
      header: { home: 'Inicio', contact: 'Contacto', share: 'Compartir' }, 
      home: { title: 'Besoo Liker', subtitle: '100% Real y Seguro', desc: 'Aumenta tus publicaciones con un clic.', instant: 'Instantáneo', safe: 'Seguro', start: 'Empezar' },
      info: { pageNum: 'Página 1 de 3', buttonReady: 'Continuar', buttonWait: 'Espera...', welcomeTitle: '⭐ Bienvenido', featuresTitle: '🚀 Características', feat1Title: 'Rápido:', feat1Desc: 'Reacciones reales.', feat2Title: 'Seguro:', feat2Desc: 'Sin contraseña.', feat3Title: 'Fácil:', feat3Desc: 'Interfaz simple.' },
      faq: { pageNum: 'Página 2 de 3', title: '🌐 ¿Cómo funciona?', step1Title: 'Sin registro', step1Desc: 'Seguro.', step2Title: 'Copiar enlace', step2Desc: 'De la publicación.', step3Title: 'Enviar', step3Desc: 'Elige reacción.', step4Title: 'Resultados', step4Desc: 'Mira el contador.' },
      timer: { finalStep: 'Paso Final', buttonGet: 'Continuar', buttonPrep: 'Cargando...', ready: '¡Listo!' },
      final: { placeholder: 'Enlace del post', wait: 'Espera', send: 'Enviar', sending: 'Enviando...', toast: { ...defaultEn.final.toast, success: 'Éxito', error: 'Error', fill: 'Rellenar datos' } },
      ban: { title: "Acceso Restringido", desc: "Actividad sospechosa.", timer: "Levantado en:" }, 
      adblock: { title: "AdBlock Detectado", desc: "Desactiva AdBlock." } 
  },
  fr: { 
      ...defaultEn, 
      header: { home: 'Accueil', contact: 'Contact', share: 'Partager' }, 
      home: { title: 'Besoo Liker', subtitle: '100% Vrai & Sûr', desc: 'Boostez vos posts en un clic.', instant: 'Instantané', safe: 'Sûr', start: 'Commencer' },
      info: { pageNum: 'Page 1 sur 3', buttonReady: 'Continuer', buttonWait: 'Attendez...', welcomeTitle: '⭐ Bienvenue', featuresTitle: '🚀 Caractéristiques', feat1Title: 'Rapide:', feat1Desc: 'Réactions réelles.', feat2Title: 'Sûr:', feat2Desc: 'Pas de mot de passe.', feat3Title: 'Facile:', feat3Desc: 'Interface simple.' },
      faq: { pageNum: 'Page 2 sur 3', title: '🌐 Comment ça marche?', step1Title: 'Pas d\'inscription', step1Desc: 'Sécurisé.', step2Title: 'Copier le lien', step2Desc: 'Du post.', step3Title: 'Envoyer', step3Desc: 'Choisir réaction.', step4Title: 'Résultats', step4Desc: 'Voir le compteur.' },
      timer: { finalStep: 'Dernière étape', buttonGet: 'Continuer', buttonPrep: 'Chargement...', ready: 'Prêt!' },
      final: { placeholder: 'Lien du post', wait: 'Attendez', send: 'Envoyer', sending: 'Envoi...', toast: { ...defaultEn.final.toast, success: 'Succès', error: 'Erreur', fill: 'Remplir les données' } },
      ban: { title: "Accès Restreint", desc: "Activité suspecte.", timer: "Levé dans:" }, 
      adblock: { title: "AdBlock Détecté", desc: "Désactivez AdBlock." }
  },
  de: { 
      ...defaultEn, 
      header: { home: 'Startseite', contact: 'Kontakt', share: 'Teilen' },
      home: { title: 'Besoo Liker', subtitle: '100% Echt & Sicher', desc: 'Booste deine Beiträge mit einem Klick.', instant: 'Sofort', safe: 'Sicher', start: 'Starten' },
      info: { pageNum: 'Seite 1 von 3', buttonReady: 'Weiter', buttonWait: 'Warten...', welcomeTitle: '⭐ Willkommen', featuresTitle: '🚀 Funktionen', feat1Title: 'Schnell:', feat1Desc: 'Echte Reaktionen.', feat2Title: 'Sicher:', feat2Desc: 'Kein Passwort.', feat3Title: 'Einfach:', feat3Desc: 'Einfache Oberfläche.' },
      faq: { pageNum: 'Seite 2 von 3', title: '🌐 Wie funktioniert es?', step1Title: 'Keine Anmeldung', step1Desc: 'Sicher.', step2Title: 'Link kopieren', step2Desc: 'Vom Beitrag.', step3Title: 'Senden', step3Desc: 'Reaktion wählen.', step4Title: 'Ergebnisse', step4Desc: 'Zähler beobachten.' },
      timer: { finalStep: 'Letzter Schritt', buttonGet: 'Weiter', buttonPrep: 'Laden...', ready: 'Bereit!' },
      final: { placeholder: 'Beitragslink', wait: 'Warten', send: 'Senden', sending: 'Senden...', toast: { ...defaultEn.final.toast, success: 'Erfolg', error: 'Fehler', fill: 'Daten ausfüllen' } },
      ban: { title: "Zugriff Beschränkt", desc: "Verdächtige Aktivität.", timer: "Aufgehoben in:" }, 
      adblock: { title: "AdBlock Erkannt", desc: "Deaktiviere AdBlock." }
  },
  ru: { 
      ...defaultEn, 
      header: { home: 'Главная', contact: 'Контакты', share: 'Поделиться' },
      home: { title: 'Besoo Liker', subtitle: '100% Реально и Безопасно', desc: 'Продвигайте посты одним кликом.', instant: 'Мгновенно', safe: 'Безопасно', start: 'Начать' },
      info: { pageNum: 'Страница 1 из 3', buttonReady: 'Продолжить', buttonWait: 'Ждите...', welcomeTitle: '⭐ Добро пожаловать', featuresTitle: '🚀 Особенности', feat1Title: 'Быстро:', feat1Desc: 'Реальные реакции.', feat2Title: 'Безопасно:', feat2Desc: 'Без пароля.', feat3Title: 'Просто:', feat3Desc: 'Простой интерфейс.' },
      faq: { pageNum: 'Страница 2 из 3', title: '🌐 Как это работает?', step1Title: 'Без регистрации', step1Desc: 'Безопасно.', step2Title: 'Копировать ссылку', step2Desc: 'Поста.', step3Title: 'Отправить', step3Desc: 'Выбрать реакцию.', step4Title: 'Результаты', step4Desc: 'Смотреть счетчик.' },
      timer: { finalStep: 'Финальный шаг', buttonGet: 'Продолжить', buttonPrep: 'Загрузка...', ready: 'Готово!' },
      final: { placeholder: 'Ссылка на пост', wait: 'Ждите', send: 'Отправить', sending: 'Отправка...', toast: { ...defaultEn.final.toast, success: 'Успех', error: 'Ошибка', fill: 'Заполните данные' } },
      ban: { title: "Доступ Ограничен", desc: "Подозрительная активность.", timer: "Снято через:" }, 
      adblock: { title: "AdBlock Обнаружен", desc: "Отключите AdBlock." }
  },
  zh: { 
      ...defaultEn, 
      header: { home: '首页', contact: '联系我们', share: '分享' },
      home: { title: 'Besoo Liker', subtitle: '100% 真实安全', desc: '一键提升帖子热度。', instant: '即时', safe: '安全', start: '开始' },
      info: { pageNum: '第 1 页，共 3 页', buttonReady: '继续', buttonWait: '请稍候...', welcomeTitle: '⭐ 欢迎', featuresTitle: '🚀以此', feat1Title: '快速:', feat1Desc: '真实反应。', feat2Title: '安全:', feat2Desc: '无需密码。', feat3Title: '简单:', feat3Desc: '界面简洁。' },
      timer: { finalStep: '最后一步', buttonGet: '继续', buttonPrep: '加载中...', ready: '准备就绪！' },
      final: { placeholder: '帖子链接', wait: '等待', send: '发送', sending: '发送中...', toast: { ...defaultEn.final.toast, success: '成功', error: '错误', fill: '填写数据' } },
      ban: { title: "访问受限", desc: "可疑活动。", timer: "解禁时间:" }, 
      adblock: { title: "检测到广告拦截", desc: "请关闭广告拦截。" }
  },
  pt: { 
      ...defaultEn, 
      header: { home: 'Início', contact: 'Contato', share: 'Compartilhar' },
      home: { title: 'Besoo Liker', subtitle: '100% Real e Seguro', desc: 'Impulsione seus posts com um clique.', instant: 'Instantâneo', safe: 'Seguro', start: 'Começar' },
      info: { pageNum: 'Página 1 de 3', buttonReady: 'Continuar', buttonWait: 'Aguarde...', welcomeTitle: '⭐ Bem-vindo', featuresTitle: '🚀 Recursos', feat1Title: 'Rápido:', feat1Desc: 'Reações reais.', feat2Title: 'Seguro:', feat2Desc: 'Sem senha.', feat3Title: 'Fácil:', feat3Desc: 'Interface simples.' },
      timer: { finalStep: 'Passo Final', buttonGet: 'Continuar', buttonPrep: 'Carregando...', ready: 'Pronto!' },
      final: { placeholder: 'Link do post', wait: 'Aguarde', send: 'Enviar', sending: 'Enviando...', toast: { ...defaultEn.final.toast, success: 'Sucesso', error: 'Erro', fill: 'Preencher dados' } },
      ban: { title: "Acesso Restrito", desc: "Atividade suspeita.", timer: "Liberado em:" }, 
      adblock: { title: "AdBlock Detectado", desc: "Desative o AdBlock." }
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