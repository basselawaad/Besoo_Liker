import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, EyeOff, ShieldAlert, Ban, MonitorX, Link2Off, Clock, Terminal, Code2 } from 'lucide-react';

// تأكد من تطابق أسماء الملفات مع المجلدات
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import InfoPage from './pages/InfoPage';
import FAQPage from './pages/FAQPage';
import TimerPage from './pages/TimerPage';
import FinalPage from './pages/FinalPage';

// Import shared logic from store to prevent circular dependencies
import { SecureStorage, translations, AppContext, useAppConfig, Lang, BAN_KEY } from './store';

// --- COMPONENTS FOR BAN UI ---
const BanTimerDisplay = ({ targetTime }: { targetTime: number }) => {
    // Initial calculation
    const calculateTimeLeft = () => Math.max(0, targetTime - Date.now());
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Update timer every second
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (remaining <= 0) {
                // If ban is over, reload to clear the state
                window.location.reload();
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetTime]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="font-mono text-xl md:text-2xl font-black text-red-500 tracking-widest bg-black/40 px-4 py-2 rounded-lg border border-red-500/20 shadow-inner">
            {formatTime(timeLeft)}
        </div>
    );
};

// Logic Component to Handle Bans
const RouteGuard = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [banState, setBanState] = useState<'none' | 'banned' | 'shortener'>('none');
    const [banEndTime, setBanEndTime] = useState<number | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isUnlockUrl, setIsUnlockUrl] = useState(false);
    
    // عداد سري لفك الحظر يدوياً
    const [secretClicks, setSecretClicks] = useState(0);

    const { t, lang } = useAppConfig();

    // --- ADMIN UNBAN CHECK (IMMEDIATE) ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const unlockCode = searchParams.get('unlock');
            if (unlockCode === 'admin_besoo') {
                setIsUnlockUrl(true);
                setIsUnlocking(true);
                SecureStorage.removeBan();
                SecureStorage.setAdmin();
                // مسح الرابط بعد فترة قصيرة
                setTimeout(() => {
                   window.location.href = window.location.pathname;
                }, 2000);
            }
        }
    }, []);

    const handleSecretUnban = () => {
        const newClicks = secretClicks + 1;
        setSecretClicks(newClicks);
        if (newClicks >= 5) {
            SecureStorage.removeBan();
            SecureStorage.setAdmin();
            window.location.href = "/";
        }
    };

    // --- REAL-TIME BAN MONITORING ---
    useEffect(() => {
        if (isUnlocking || isUnlockUrl || SecureStorage.isAdmin()) return;

        // This function checks the ban status from storage
        const checkBanStatus = () => {
             const banTimestamp = SecureStorage.getBan();
             if (banTimestamp) {
                if (Date.now() < banTimestamp) {
                    setBanState('banned');
                    setBanEndTime(banTimestamp);
                } else {
                    localStorage.removeItem(BAN_KEY);
                    setBanState('none');
                    setBanEndTime(null);
                }
             } else {
                 setBanState('none');
             }
        };

        // 1. Check immediately on mount
        checkBanStatus();

        // 2. Poll every second
        const intervalId = setInterval(checkBanStatus, 1000);

        // 3. Listen to storage events
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === null || e.key.includes(BAN_KEY) || e.key.includes("sys")) {
                checkBanStatus();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [isUnlocking, isUnlockUrl]);

    // --- NAVIGATION & REFERRER CHECKS ---
    useEffect(() => {
        // إذا كان المستخدم أدمن، تجاوز كل الفحوصات
        if (SecureStorage.isAdmin() || isUnlocking || isUnlockUrl) return;

        // If already banned, skip further checks
        if (banState === 'banned') return;

        // دالة تطبيق الحظر لمدة 24 ساعة
        const applyBan = () => {
             const existingBan = SecureStorage.getBan();
             if (existingBan && existingBan > Date.now()) {
                 setBanState('banned');
                 setBanEndTime(existingBan);
             } else {
                 const banDuration = 24 * 60 * 60 * 1000; // 24 Hours
                 const endTime = Date.now() + banDuration;
                 SecureStorage.setBan(endTime);
                 setBanState('banned');
                 setBanEndTime(endTime);
             }
        };

        // 1. Check if running in Iframe
        if (window.self !== window.top) {
            try {
                window.top!.location = window.self.location; 
            } catch (e) {
                applyBan();
            }
            return;
        }

        // 2. Anti-Shortener
        const referrer = document.referrer ? document.referrer.toLowerCase() : '';
        const badReferrers = ['bit.ly', 'goo.gl', 'tinyurl', 'ow.ly', 't.co', 'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'cut.ly', 'cutt.ly'];
        if (badReferrers.some(r => referrer.includes(r))) {
            setBanState('shortener');
            return;
        }

        // 3. Sequence Check (Prevent skipping steps)
        if (location.pathname !== '/') {
            const sessionActive = sessionStorage.getItem('session_active');
            
            const isStep1Violation = location.pathname === '/step-1' && !sessionActive;
            const isStep2Violation = location.pathname === '/step-2' && !sessionStorage.getItem('step1_completed');
            const isStep3Violation = location.pathname === '/step-3' && !sessionStorage.getItem('step2_completed');
            const isFinalViolation = location.pathname === '/destination' && !sessionStorage.getItem('step3_completed');

            if (isStep1Violation || isStep2Violation || isStep3Violation || isFinalViolation) {
                // STRICT PUNISHMENT ENABLED: Ban user if they try to skip steps
                applyBan();
            }
        }
    }, [location, banState, isUnlocking, isUnlockUrl]);

    if (isUnlocking || isUnlockUrl) {
        return (
             <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
                 <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                 >
                     <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                        <Terminal className="w-12 h-12 text-green-500" />
                     </div>
                     <div>
                         <h1 className="text-3xl font-black text-green-500 mb-2 tracking-wider">ACCESS GRANTED</h1>
                         <p className="text-green-400/60 font-mono text-sm">System Override Initiated...</p>
                     </div>
                     <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">
                         <motion.div 
                             initial={{ width: "0%" }}
                             animate={{ width: "100%" }}
                             transition={{ duration: 2 }}
                             className="h-full bg-green-500"
                         />
                     </div>
                     <p className="text-white font-bold mt-4">Welcome Back, Admin</p>
                 </motion.div>
             </div>
        );
    }

    if (banState === 'banned') {
        return (
            <div className={`min-h-[60vh] flex flex-col items-center justify-center p-6 text-center w-full ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-950/80 border-2 border-red-600 rounded-3xl p-10 max-w-lg shadow-[0_0_80px_rgba(220,38,38,0.4)] backdrop-blur-md"
                >
                    {/* Secret Button Wrapper */}
                    <div 
                        onClick={handleSecretUnban} 
                        className="bg-red-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 cursor-pointer active:scale-95 transition-transform"
                        title="Restricted Area"
                    >
                        <Ban className="w-12 h-12 text-red-500 stroke-[2.5px]" />
                    </div>
                    <h1 className="text-3xl font-black text-red-500 mb-4">{t.ban?.title || "Access Restricted"}</h1>
                    <p className="text-gray-200 text-lg font-bold leading-relaxed mb-6">
                        {t.ban?.desc || "Suspicious activity detected."}
                    </p>
                    
                    {/* Countdown Display */}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-red-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                             <Clock className="w-4 h-4" />
                             {t.ban?.timer || "Lifted in:"}
                        </p>
                        {banEndTime && <BanTimerDisplay targetTime={banEndTime} />}
                    </div>

                    <div className="mt-6 text-xs text-red-400/50">
                        ID: {navigator.userAgent.slice(0, 10).replace(/\s/g, '')}-{Date.now().toString().slice(-4)}
                        {secretClicks > 0 && <span className="ml-2 text-red-500 font-bold">({secretClicks})</span>}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (banState === 'shortener') {
         return (
            <div className={`min-h-[60vh] flex flex-col items-center justify-center p-6 text-center w-full ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-orange-950/80 border-2 border-orange-500 rounded-3xl p-10 max-w-lg shadow-[0_0_80px_rgba(249,115,22,0.4)] backdrop-blur-md"
                >
                    <div className="bg-orange-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/30">
                        <Link2Off className="w-12 h-12 text-orange-500 stroke-[2.5px]" />
                    </div>
                    <h1 className="text-3xl font-black text-orange-500 mb-4">{t.shortener?.title || "Traffic Source Blocked"}</h1>
                    <p className="text-gray-200 text-lg font-bold leading-relaxed mb-6">
                        {t.shortener?.desc || "Access via URL shorteners is prohibited."}
                    </p>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
};

// Wrapper to handle AnimatePresence location
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <RouteGuard>
        <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/step-1" element={<InfoPage />} />
            <Route path="/step-2" element={<FAQPage />} />
            <Route path="/step-3" element={<TimerPage />} />
            <Route path="/destination" element={<FinalPage />} />
        </Routes>
        </AnimatePresence>
    </RouteGuard>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ar');
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  // تحديث حالة الأدمن عند التحميل
  useEffect(() => {
      setIsAdmin(SecureStorage.isAdmin());
  }, []);

  // AdBlock Detection Logic
  useEffect(() => {
    if (SecureStorage.isAdmin()) return;

    const detectAdBlock = async () => {
       const bait = document.createElement('div');
       bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-banner adsbox';
       bait.style.cssText = 'height: 1px !important; width: 1px !important; position: absolute !important; left: -9999px !important; top: -9999px !important;';
       document.body.appendChild(bait);

       setTimeout(() => {
          if (
              bait.offsetParent === null || 
              bait.offsetHeight === 0 || 
              bait.offsetLeft === 0 || 
              bait.offsetTop === 0 || 
              bait.offsetWidth === 0 || 
              bait.clientHeight === 0 || 
              bait.clientWidth === 0 ||
              window.getComputedStyle(bait).display === 'none'
          ) {
              setIsAdBlockActive(true);
          }
          document.body.removeChild(bait);
       }, 200);

       try {
           await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { 
               method: 'HEAD', 
               mode: 'no-cors' 
           });
       } catch (e) {
           setIsAdBlockActive(true);
       }
    };

    detectAdBlock();
  }, []);

  // Incognito Detection
  useEffect(() => {
    if (SecureStorage.isAdmin()) return;

    const detectIncognito = async () => {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const { quota } = await navigator.storage.estimate();
                if (quota && quota < 200 * 1024 * 1024) { 
                    setIsIncognito(true);
                }
            }
        } catch (e) {}
    };
    detectIncognito();
  }, []);

  // Security Measures (DevTools & Right Click)
  useEffect(() => {
    if (SecureStorage.isAdmin()) return;

    const preventCopy = (e: ClipboardEvent) => { e.preventDefault(); };
    
    // منع كامل للقائمة المنبثقة (Right Click)
    const preventContext = (e: MouseEvent) => {
        e.preventDefault();
        setShowSecurityWarning(true);
        setTimeout(() => setShowSecurityWarning(false), 3000);
    };
    
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    
    document.addEventListener('selectstart', (e) => {
         const target = e.target as HTMLElement;
         if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
             e.preventDefault();
         }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.key === 'U') ||
            (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) || 
            (e.metaKey && e.key === 'u') ||
            (e.ctrlKey && (e.key === 's' || e.key === 'S')) // منع الحفظ
        ) {
            e.preventDefault();
            e.stopPropagation();
            setShowSecurityWarning(true);
            setTimeout(() => setShowSecurityWarning(false), 3000);
            return false;
        }
    };

    // اكتشاف DevTools عن طريق التأخير في التنفيذ (Debugger Loop)
    const antiDebugInterval = setInterval(() => {
        const start = Date.now();
        // eslint-disable-next-line no-debugger
        debugger; 
        const end = Date.now();
        // إذا كان الفرق أكثر من 100ms، فهذا يعني أن المتصفح توقف عند نقطة debugger (DevTools مفتوح)
        if (end - start > 100) {
             setIsDevToolsOpen(true);
        }
    }, 1000);

    // التحقق من تغيير حجم النافذة بشكل مريب (Docked DevTools)
    const handleResize = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        if ((widthThreshold || heightThreshold) && !SecureStorage.isAdmin()) {
            // يمكن تفعيله إذا كنت تريد صرامة أكثر، لكن debugger loop أدق
            // setIsDevToolsOpen(true); 
        }
    };
    window.addEventListener('resize', handleResize);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('contextmenu', preventContext);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('cut', preventCopy);
        window.removeEventListener('resize', handleResize);
        clearInterval(antiDebugInterval);
    };
  }, []);

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = translations[lang] || translations.en;

  // BLOCK SCREEN: DevTools Open
  if (isDevToolsOpen) {
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-zinc-900 border border-red-600 rounded-3xl p-10 max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                <Code2 className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-red-500 mb-4">{t.security?.alert || "Security Alert"}</h1>
                <p className="text-gray-300 text-lg font-bold leading-relaxed mb-6">
                    {lang === 'ar' ? 'تم اكتشاف أدوات المطور (DevTools). يرجى إغلاقها للمتابعة.' : 'Developer Tools detected. Please close them to continue.'}
                </p>
                <div className="bg-red-950/50 p-4 rounded-xl border border-red-500/20 text-red-300 text-sm font-semibold">
                    <ShieldAlert className="w-5 h-5 inline-block mx-2 mb-1" />
                    Access denied for security reasons.
                </div>
                <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-500 transition-colors">
                    {lang === 'ar' ? 'تحديث الصفحة' : 'Reload Page'}
                </button>
            </div>
        </div>
    );
  }

  // BLOCK SCREEN: Incognito
  if (isIncognito) {
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-zinc-900 border border-red-600 rounded-3xl p-10 max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                <EyeOff className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-red-500 mb-4">{t.incognito?.title || "Private Mode Detected"}</h1>
                <p className="text-gray-300 text-lg font-bold leading-relaxed mb-6">
                    {t.incognito?.desc || "Please close Incognito mode."}
                </p>
                <div className="bg-red-950/50 p-4 rounded-xl border border-red-500/20 text-red-300 text-sm font-semibold">
                    <ShieldAlert className="w-5 h-5 inline-block mx-2 mb-1" />
                    System requires storage access to persist timer data properly.
                </div>
            </div>
        </div>
    );
  }

  // BLOCK SCREEN: AdBlock
  if (isAdBlockActive) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-10 max-w-lg shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <MonitorX className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-yellow-500 mb-4">{t.adblock?.title || "Ad Blocker Detected"}</h1>
                <p className="text-gray-300 text-lg font-bold leading-relaxed mb-6">
                    {t.adblock?.desc || "Please disable your Ad Blocker."}
                </p>
                <button onClick={() => window.location.reload()} className="bg-yellow-500 text-black font-black py-3 px-8 rounded-xl hover:bg-yellow-400 transition-colors">
                    {t.final?.msg?.react === 'Reaction' ? 'I Disabled It, Reload' : 'قمت بإغلاقه، تحديث الصفحة'}
                </button>
            </div>
        </div>
      );
  }

  return (
    <AppContext.Provider value={{ lang, setLang, toggleLang, isAdmin, t }}>
      <HashRouter>
        <div className={`min-h-screen flex flex-col font-sans bg-black text-yellow-400 selection:bg-yellow-400 selection:text-black ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <Header />
          
          <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center relative">
            <AnimatedRoutes />
          </main>
          
          <Footer />

          <AnimatePresence>
            {showSecurityWarning && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-red-950/90 border-2 border-red-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] backdrop-blur-xl flex flex-col items-center text-center max-w-sm pointer-events-auto"
                    >
                        <div className="bg-red-500/20 p-3 rounded-full mb-3">
                             <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-red-500 mb-2">{t.security?.alert || "Security Alert"}</h3>
                        <p className="text-white font-bold">{t.security?.desc || "Developer tools are not allowed."}</p>
                    </motion.div>
                </div>
            )}
          </AnimatePresence>

        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;