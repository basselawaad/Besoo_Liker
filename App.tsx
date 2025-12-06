import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, EyeOff, ShieldAlert, Ban, MonitorX, Link2Off, Clock, Terminal, Code2, Loader2, Lock } from 'lucide-react';

// تأكد من تطابق أسماء الملفات مع المجلدات
import Header from './components/Header';
import Footer from './components/Footer';

// استخدام Lazy Loading لتحسين سرعة تحميل الموقع (Code Splitting)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const InfoPage = React.lazy(() => import('./pages/InfoPage'));
const FAQPage = React.lazy(() => import('./pages/FAQPage'));
const TimerPage = React.lazy(() => import('./pages/TimerPage'));
const FinalPage = React.lazy(() => import('./pages/FinalPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));

// Import shared logic from store to prevent circular dependencies
import { SecureStorage, translations, AppContext, AuthProvider, useAppConfig, Lang, BAN_KEY, sendTelegramLog } from './store';

// --- Loading Spinner Component ---
const PageLoader = () => {
    // We handle t inside safely
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-yellow-500">
            <Loader2 className="w-16 h-16 animate-spin mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            <p className="font-bold text-lg animate-pulse tracking-widest text-yellow-400/80">LOADING...</p>
        </div>
    );
};

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

// --- AUTH GUARD ---
const RequireAuth = ({ children }: { children?: React.ReactNode }) => {
    const { isAuthenticated, t } = useAppConfig();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
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

    // --- REFRESH PROTECTION LOGIC ---
    useEffect(() => {
        try {
            const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
            if (navEntry && navEntry.type === 'reload' && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/signup') {
                sessionStorage.clear();
                window.location.replace('/');
            }
        } catch (e) {}
    }, []);

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

    // --- REAL-TIME BAN MONITORING (With Fingerprint & IndexedDB) ---
    useEffect(() => {
        if (isUnlocking || isUnlockUrl || SecureStorage.isAdmin()) return;

        const checkBanStatus = async () => {
             const banTimestamp = await SecureStorage.getBan();
             if (banTimestamp) {
                if (Date.now() < banTimestamp) {
                    setBanState('banned');
                    setBanEndTime(banTimestamp);
                } else {
                    SecureStorage.removeBan();
                    setBanState('none');
                    setBanEndTime(null);
                }
             } else {
                 // Check logic only applies if no ban is currently active
             }
        };

        checkBanStatus();
        const intervalId = setInterval(checkBanStatus, 2000); // Check regularly

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
        if (SecureStorage.isAdmin() || isUnlocking || isUnlockUrl) return;
        if (banState === 'banned') return;

        const applyBan = (reason: string) => {
             const banDuration = 24 * 60 * 60 * 1000;
             const endTime = Date.now() + banDuration;
             SecureStorage.setBan(endTime);
             setBanState('banned');
             setBanEndTime(endTime);
             sendTelegramLog('BANNED', reason, `Path: ${location.pathname}`);
        };

        // 1. Check if running in Iframe
        if (window.self !== window.top) {
            try {
                window.top!.location = window.self.location; 
            } catch (e) {
                applyBan("Iframe Detected");
            }
            return;
        }

        // 2. Anti-Shortener
        const referrer = document.referrer ? document.referrer.toLowerCase() : '';
        const badReferrers = ['bit.ly', 'goo.gl', 'tinyurl', 'ow.ly', 't.co', 'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'cut.ly', 'cutt.ly'];
        if (badReferrers.some(r => referrer.includes(r))) {
            applyBan("URL Shortener Detected");
            return;
        }

        // 3. Sequence Check (Redirect if internal page accessed without context)
        const publicPaths = ['/login', '/signup', '/home'];
        if (location.pathname !== '/' && !publicPaths.includes(location.pathname)) {
            const sessionActive = sessionStorage.getItem('session_active');
            const isStep1Violation = location.pathname === '/step-1' && !sessionActive;
            const isStep2Violation = location.pathname === '/step-2' && !sessionStorage.getItem('step1_completed');
            const isStep3Violation = location.pathname === '/step-3' && !sessionStorage.getItem('step2_completed');
            const isFinalViolation = location.pathname === '/destination' && !sessionStorage.getItem('step3_completed');

            if (isStep1Violation || isStep2Violation || isStep3Violation || isFinalViolation) {
                window.location.replace('/');
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

    if (banState === 'banned' || banState === 'shortener') {
        return (
            <div className={`min-h-[60vh] flex flex-col items-center justify-center p-6 text-center w-full ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-950/80 border-2 border-red-600 rounded-3xl p-10 max-w-lg shadow-[0_0_80px_rgba(220,38,38,0.4)] backdrop-blur-md"
                >
                    <div 
                        onClick={handleSecretUnban} 
                        className="bg-red-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 cursor-pointer active:scale-95 transition-transform"
                    >
                        <Ban className="w-12 h-12 text-red-500 stroke-[2.5px]" />
                    </div>
                    <h1 className="text-3xl font-black text-red-500 mb-4">{t.ban?.title || "Access Restricted"}</h1>
                    <p className="text-gray-200 text-lg font-bold leading-relaxed mb-6">
                        {t.ban?.desc || "Suspicious activity detected."}
                    </p>
                    
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-red-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                             <Clock className="w-4 h-4" />
                             {t.ban?.timer || "Lifted in:"}
                        </p>
                        {banEndTime && <BanTimerDisplay targetTime={banEndTime} />}
                    </div>
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
            <Suspense fallback={<PageLoader />}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    
                    {/* Handle Supabase Redirect */}
                    <Route path="/home" element={<Navigate to="/" replace />} />

                    {/* Protected Routes */}
                    <Route path="/" element={
                        <RequireAuth>
                            <HomePage />
                        </RequireAuth>
                    } />
                    <Route path="/step-1" element={
                        <RequireAuth>
                            <InfoPage />
                        </RequireAuth>
                    } />
                    <Route path="/step-2" element={
                        <RequireAuth>
                            <FAQPage />
                        </RequireAuth>
                    } />
                    <Route path="/step-3" element={
                        <RequireAuth>
                            <TimerPage />
                        </RequireAuth>
                    } />
                    <Route path="/destination" element={
                        <RequireAuth>
                            <FinalPage />
                        </RequireAuth>
                    } />
                </Routes>
            </Suspense>
        </AnimatePresence>
    </RouteGuard>
  );
};

const App: React.FC = () => {
  const getInitialLang = (): Lang => {
    const storedLang = localStorage.getItem('besoo_app_lang');
    if (storedLang && translations[storedLang as Lang]) {
        return storedLang as Lang;
    }
    try {
        const browserLang = navigator.language.split('-')[0];
        const supportedLangs = ['ar', 'en', 'es', 'fr', 'de', 'pt', 'ru', 'zh'];
        if (supportedLangs.includes(browserLang)) {
            return browserLang as Lang;
        }
    } catch (e) {}
    return 'ar';
  };

  const [lang, setLangState] = useState<Lang>(getInitialLang());
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const setLang = (newLang: Lang) => {
      setLangState(newLang);
      localStorage.setItem('besoo_app_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  useEffect(() => {
      setIsAdmin(SecureStorage.isAdmin());
  }, []);

  // AdBlock Detection Logic
  useEffect(() => {
    if (SecureStorage.isAdmin()) return;

    const detectAdBlock = async () => {
       let detected = false;
       // @ts-ignore
       if (navigator.brave && await navigator.brave.isBrave()) detected = true;

       if (!detected) {
           const bait = document.createElement('div');
           bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-banner adsbox ad-blocker-bait banner_ad';
           bait.style.cssText = 'height: 1px !important; width: 1px !important; position: absolute !important; left: -9999px !important; top: -9999px !important;';
           document.body.appendChild(bait);

           if (
              bait.offsetParent === null || 
              bait.offsetHeight === 0 || 
              bait.offsetLeft === 0 || 
              bait.offsetTop === 0 || 
              bait.offsetWidth === 0 || 
              bait.clientHeight === 0 || 
              bait.clientWidth === 0 ||
              window.getComputedStyle(bait).display === 'none' ||
              window.getComputedStyle(bait).visibility === 'hidden'
          ) {
              detected = true;
          }
          document.body.removeChild(bait);
       }

       if (!detected) {
           try {
               await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors' });
           } catch (e) {
               detected = true;
           }
       }

       if (detected) {
           setIsAdBlockActive(true);
           const endTime = Date.now() + 3600000;
           SecureStorage.setBan(endTime); 
           sendTelegramLog('BANNED', 'AdBlock Detected');
       }
    };

    detectAdBlock();
    const interval = setInterval(detectAdBlock, 5000); 
    return () => clearInterval(interval);
  }, []);

  // Strict Incognito Detection
  useEffect(() => {
    if (SecureStorage.isAdmin()) return;

    const detectIncognito = async () => {
        const isPrivate = await SecureStorage.isIncognitoMode();
        if (isPrivate) {
            setIsIncognito(true);
            const endTime = Date.now() + (24 * 60 * 60 * 1000); 
            SecureStorage.setBan(endTime);
            sendTelegramLog('BANNED', 'Incognito Mode Detected');
        }
    };
    detectIncognito();
  }, []);

  // Security Measures
  useEffect(() => {
    if (SecureStorage.isAdmin()) return;

    const triggerSecurityAlert = () => {
        setShowSecurityWarning(true);
        setTimeout(() => setShowSecurityWarning(false), 3500);
    };

    const preventCopy = (e: ClipboardEvent) => { 
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault(); 
    };

    const preventContext = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        triggerSecurityAlert();
    };
    
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    
    document.addEventListener('selectstart', (e) => {
         const target = e.target as HTMLElement;
         if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') e.preventDefault();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.key === 'U') ||
            (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) || 
            (e.metaKey && e.key === 'u') ||
            (e.ctrlKey && (e.key === 's' || e.key === 'S'))
        ) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityAlert();
            return false;
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('contextmenu', preventContext);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('cut', preventCopy);
    };
  }, []);

  const t = translations[lang] || translations.en;

  if (isIncognito) {
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-zinc-900 border border-red-600 rounded-3xl p-10 max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                <EyeOff className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-red-500 mb-4">{t.incognito?.title || "Private Mode Detected"}</h1>
                <p className="text-gray-300 text-lg font-bold leading-relaxed mb-6">
                    {t.incognito?.desc || "Please close Incognito mode."}
                </p>
            </div>
        </div>
    );
  }

  if (isAdBlockActive) {
      return (
        <div className={`fixed inset-0 z-[99999] min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-10 max-w-lg shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <MonitorX className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-yellow-500 mb-4">{t.adblock?.title || "Ad Blocker Detected"}</h1>
                <p className="text-gray-300 text-lg font-bold leading-relaxed mb-6">
                    {t.adblock?.desc || "Please disable your Ad Blocker."}
                </p>
                <button onClick={() => window.location.reload()} className="bg-yellow-500 text-black font-black py-3 px-8 rounded-xl hover:bg-yellow-400 transition-colors w-full">
                    {t.final?.msg?.react === 'Reaction' ? 'Reload' : 'تحديث الصفحة'}
                </button>
            </div>
        </div>
      );
  }

  return (
    <AppContext.Provider value={{ lang, setLang, toggleLang, isAdmin, t }}>
      <AuthProvider>
        <HashRouter>
            <div className={`min-h-screen flex flex-col font-sans bg-black text-yellow-400 selection:bg-yellow-400 selection:text-black ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <Header />
            
            <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center relative">
                <AnimatedRoutes />
            </main>
            
            <Footer />

            <AnimatePresence>
                {showSecurityWarning && (
                    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none w-full flex justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-zinc-900/95 text-white px-6 py-3 rounded-full shadow-lg border border-zinc-700/50 backdrop-blur-md max-w-xs text-center"
                        >
                            <span className="font-bold text-sm tracking-wide text-gray-200">
                                {t.security?.desc || "Security Restriction"}
                            </span>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            </div>
        </HashRouter>
      </AuthProvider>
    </AppContext.Provider>
  );
};

export default App;