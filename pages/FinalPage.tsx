import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Clock } from 'lucide-react';
import { useAppConfig, SecureStorage, sendTelegramLog } from '../store';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['👍', '❤️', '🥰', '😆', '😯', '😢', '😡'];

const FinalPage: React.FC = () => {
  const [link, setLink] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState(''); // مصيدة البوتات
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { t, isAdmin, currentUser } = useAppConfig();
  const navigate = useNavigate();

  // Service Page logic: Strict check for sequence
  useEffect(() => {
    // التحقق من وجود جميع المفاتيح لضمان المرور بالتسلسل الصحيح
    const step1 = sessionStorage.getItem('step1_completed');
    const step2 = sessionStorage.getItem('step2_completed');
    const step3 = sessionStorage.getItem('step3_completed');

    if ((!step1 || !step2 || !step3) && !isAdmin) {
      navigate('/');
    }
  }, [navigate, isAdmin]);

  // تعديل هام: التحقق من "مؤقت الانتظار" بدلاً من "الحظر"
  useEffect(() => {
    const checkCooldown = () => {
        // نستخدم getItem (الخاص بالمؤقت) بدلاً من getBan (الخاص بالحظر)
        const savedEndTime = SecureStorage.getItem(); 
        if (savedEndTime) {
            const endTime = parseInt(savedEndTime);
            if (!isNaN(endTime)) {
                const remaining = Math.floor((endTime - Date.now()) / 1000);
                if (remaining > 0) {
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft(null);
                    SecureStorage.removeItem();
                }
            }
        }
    };
    checkCooldown();
    const intervalId = setInterval(checkCooldown, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleEmoji = (emojiId: string) => {
    if (timeLeft !== null) return;
    if (selectedEmojis.includes(emojiId)) {
      setSelectedEmojis(selectedEmojis.filter(e => e !== emojiId));
    } else {
      if (selectedEmojis.length >= 1) {
        showToast(`⚠️ ${t.final.toast.oneEmoji}`, 'error');
        return;
      }
      setSelectedEmojis([...selectedEmojis, emojiId]);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sanitizeInput = (input: string) => {
    return input.replace(/<[^>]*>?/gm, "").trim();
  };

  const handleSend = async () => {
    setLoading(true);

    // --- SECURITY FIREWALL ---
    // 1. Honeypot Check (Bots)
    if (honeypot && !isAdmin) {
        setLoading(false);
        showToast(t.final.toast.bot || "Bot Detected", "error");
        sendTelegramLog('BANNED', 'Honeypot Triggered');
        return; 
    }

    // 2. Strict Link/Sequence Check
    const step1 = sessionStorage.getItem('step1_completed');
    const step2 = sessionStorage.getItem('step2_completed');
    const step3 = sessionStorage.getItem('step3_completed');
    if ((!step1 || !step2 || !step3) && !isAdmin) {
        setLoading(false);
        showToast(t.shortener?.title || "Sequence Error", "error");
        setTimeout(() => navigate('/'), 2000);
        return; 
    }

    // 3. Incognito Check - Actual Ban Enforcement
    const isIncognito = await SecureStorage.isIncognitoMode();
    if (isIncognito && !isAdmin) {
        setLoading(false);
        showToast("Incognito Mode Not Allowed", "error");
        // حظر فعلي عند محاولة الإرسال من المتصفح الخفي
        const endTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        await SecureStorage.setBan(endTime);
        sendTelegramLog('BANNED', 'Incognito Mode on Submission');
        window.location.reload();
        return; 
    }

    // 4. AdBlock Check (Warning only, no ban)
    try {
        await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors' });
    } catch (e) {
        if (!isAdmin) {
            setLoading(false);
            showToast(t.adblock?.title || "AdBlock Detected", "error");
            // No ban here, just preventing submission
            return; 
        }
    }
    // --- END SECURITY FIREWALL ---

    const fbRegex = /^(https?:\/\/)?(www\.|web\.|m\.|mobile\.)?(facebook\.com|fb\.watch|fb\.com|fb\.me)\/.+/i;
    const cleanLink = sanitizeInput(link);

    if (!cleanLink || selectedEmojis.length === 0) {
      setLoading(false);
      showToast(t.final.toast.fill, "error");
      return;
    }
    if (!fbRegex.test(cleanLink)) {
        setLoading(false);
        showToast(t.final.toast.invalidFb, "error");
        return;
    }

    const currentCount = localStorage.getItem('besoo_user_request_count');
    const nextCount = currentCount ? parseInt(currentCount) + 1 : 1;

    // Build Telegram Message - Specific Format Requested
    const details = `👤 *طلب جديد (رقم ${nextCount})*\n` +
                    `📧 *الجيميل:* \`${currentUser ? currentUser.email : "غير مسجل"}\`\n` +
                    `😍 *نوع التفاعل:* ${selectedEmojis.join(", ")}\n` +
                    `🔗 *الرابط:* \`${cleanLink}\``;

    try {
      await sendTelegramLog('GOOD_USER', 'Successful Request', details);
      localStorage.setItem('besoo_user_request_count', nextCount.toString());
      
      showToast(t.final.toast.sent, "success");
      
      const duration = 1200; // 20 دقيقة
      const endTime = Date.now() + duration * 1000;
      
      SecureStorage.setItem(endTime.toString()); // استخدام مخزن المؤقت
      
      setTimeLeft(duration);
      setLink('');
      setSelectedEmojis([]);
    } catch (error) {
      console.error("Telegram Send Error:", error);
      showToast(t.final.toast.fail, "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col items-center relative"
    >
      <AnimatePresence>
        {toast && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-zinc-900 border-2 border-white/10 p-8 rounded-2xl shadow-2xl text-center w-80 backdrop-blur-xl`}
            >
              <div className={`text-2xl font-black mb-3 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {toast.type === 'success' ? t.final.toast.success : t.final.toast.error}
              </div>
              <p className="text-white text-base font-bold mb-6 leading-relaxed">{toast.message.replace(/⚠️|✅|❌/g, '')}</p>
              <button onClick={() => setToast(null)} className="bg-white text-black font-black px-8 py-3 rounded-xl text-base hover:bg-gray-200 transition-colors w-full">{t.final.toast.ok}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg flex flex-col items-center px-4 bg-zinc-950/80 p-8 rounded-2xl border border-yellow-600/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="flex items-center gap-2 mb-6 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-xs font-bold tracking-wider uppercase">{t.final.ssl}</span>
        </div>

        <h1 className="text-3xl font-black mb-8 text-yellow-400 tracking-wide">{t.home.title}</h1>

        <div className="w-full relative mb-6">
            <input 
                type="text" 
                name="website_url_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}
                tabIndex={-1}
                autoComplete="off"
            />

            <input 
              type="text" 
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={timeLeft !== null}
              placeholder={t.final.placeholder}
              className="w-full bg-black text-white placeholder-gray-500 border-2 border-gray-800 text-center text-lg font-bold py-4 px-6 rounded-2xl focus:outline-none focus:border-yellow-500 focus:bg-zinc-900 transition-all shadow-inner"
              dir="ltr"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
            </div>
        </div>

        <div className="w-full flex flex-wrap justify-center gap-4 mb-8">
            {EMOJIS.map((emoji) => {
                const isSelected = selectedEmojis.includes(emoji);
                const isDisabled = timeLeft !== null;

                return (
                    <motion.button
                        key={emoji}
                        onClick={() => toggleEmoji(emoji)}
                        disabled={isDisabled}
                        layout
                        initial={false}
                        animate={{
                            scale: isSelected ? 1.15 : 1,
                            backgroundColor: isSelected ? "rgba(234, 179, 8, 0.2)" : "rgba(24, 24, 27, 0.5)",
                            borderColor: isSelected ? "rgba(234, 179, 8, 1)" : "transparent",
                            boxShadow: isSelected 
                                ? "0 0 20px rgba(234, 179, 8, 0.4)" 
                                : "0 0 0 rgba(0,0,0,0)",
                            filter: isDisabled ? "grayscale(100%) opacity(0.5)" : "grayscale(0%) opacity(1)"
                        }}
                        whileHover={!isDisabled ? { 
                            scale: 1.25, 
                            rotate: [0, -10, 10, -5, 5, 0],
                            transition: { duration: 0.4, type: "spring", stiffness: 300 }
                        } : {}}
                        whileTap={!isDisabled ? { scale: 0.9 } : {}}
                        className={`text-4xl p-4 rounded-2xl border-2 cursor-pointer outline-none select-none transition-colors ${!isDisabled && !isSelected ? 'hover:bg-zinc-800' : ''} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                    >
                        <motion.div
                            animate={isSelected ? { 
                                y: [0, -5, 0],
                            } : {
                                y: 0
                            }}
                            transition={isSelected ? {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            } : {}}
                        >
                            {emoji}
                        </motion.div>
                    </motion.button>
                );
            })}
        </div>

        {timeLeft !== null ? (
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center w-full bg-zinc-900/80 p-6 rounded-2xl border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
            >
                <div className="flex items-center justify-center gap-2 text-yellow-500 font-bold mb-3 uppercase tracking-wider text-sm">
                    <Clock className="w-5 h-5 animate-pulse" />
                    {t.final.wait}
                </div>
                <div className="text-5xl text-white font-black font-mono tracking-widest bg-black/40 py-4 rounded-xl border border-white/5" dir="ltr">
                    {formatTime(timeLeft)}
                </div>
                <p className="text-gray-400 text-xs mt-3 font-medium">يرجى الانتظار حتى انتهاء الوقت لإرسال طلب جديد</p>
            </motion.div>
        ) : (
            <div className="w-full">
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="w-full bg-yellow-400 text-black py-4 rounded-2xl text-xl font-black hover:bg-yellow-300 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading && <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                    {loading ? t.final.sending : t.final.send}
                </button>
            </div>
        )}

      </div>
    </motion.div>
  );
};

export default FinalPage;