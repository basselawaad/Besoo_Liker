import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock } from 'lucide-react';
import { useAppConfig, SecureStorage } from '../store';
import { useNavigate } from 'react-router-dom';

// إعدادات بوت تليجرام
const BOT_TOKEN = "8282477678:AAElPQVX-xemNjC79ojZfQLMpTxOzXXWRVE";
const CHAT_ID = "1838195482";

const EMOJIS = ['👍', '❤️', '🥰', '😆', '😯', '😢', '😡'];

const FinalPage: React.FC = () => {
  const [link, setLink] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState(''); // مصيدة البوتات
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { t, isAdmin } = useAppConfig();
  const navigate = useNavigate();

  // Service Page logic: Strict check for sequence
  useEffect(() => {
    // التحقق من وجود جميع المفاتيح لضمان المرور بالتسلسل الصحيح
    // هذا يمنع المستخدم من نسخ الرابط وفتحه في مكان آخر مباشرة
    const step1 = sessionStorage.getItem('step1_completed');
    const step2 = sessionStorage.getItem('step2_completed');
    const step3 = sessionStorage.getItem('step3_completed');

    if (!step1 || !step2 || !step3) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const savedEndTime = SecureStorage.getItem(); // استخدام المفتاح المشفر
    if (savedEndTime) {
      const remaining = Math.round((parseInt(savedEndTime) - Date.now()) / 1000);
      if (remaining > 0) setTimeLeft(remaining);
      else SecureStorage.removeItem();
    }
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      setTimeLeft(null);
      SecureStorage.removeItem();
      return;
    }
    const intervalId = setInterval(() => setTimeLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

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

  const getDeviceId = () => {
      // إنشاء بصمة جهاز بسيطة (بدون مكتبات خارجية ثقيلة)
      const ua = navigator.userAgent;
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const lang = navigator.language;
      const rawId = `${ua}-${screenRes}-${lang}`;
      // تشفير بسيط لتقصير النص
      return btoa(rawId).slice(0, 20); 
  };

  const handleSend = async () => {
    // 0. التحقق من المصيدة (Honeypot) - إذا كان الحقل ممتلئاً فهو بوت (تجاوز للأدمن)
    if (honeypot && !isAdmin) {
        // حظر صامت للبوت (إيهامه بالنجاح أو الخطأ دون إرسال داتا)
        showToast(t.final.toast.bot || "Bot Detected", "error");
        return;
    }

    const fbRegex = /^(https?:\/\/)?(www\.|web\.|m\.|mobile\.)?(facebook\.com|fb\.watch|fb\.com|fb\.me)\/.+/i;
    const cleanLink = sanitizeInput(link);

    if (!cleanLink || selectedEmojis.length === 0) {
      showToast(t.final.toast.fill, "error");
      return;
    }
    if (!fbRegex.test(cleanLink)) {
        showToast(t.final.toast.invalidFb, "error");
        return;
    }

    setLoading(true);

    // 1. الحصول على اسم التطبيق
    const appName = t.home.title;
    
    // 2. الحصول على الوقت والتاريخ الحالي
    const now = new Date();
    const timeString = now.toLocaleString('ar-EG', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric',
      hour12: true 
    });

    // 3. حساب عدد مرات الطلب للمستخدم (من LocalStorage)
    const storedCount = localStorage.getItem('besoo_user_request_count');
    const currentCount = storedCount ? parseInt(storedCount) + 1 : 1;

    // 4. بصمة الجهاز
    const deviceId = getDeviceId();

    // 5. بناء الرسالة بالتنسيق المطلوب
    const messageText = `👑 *${appName}* 👑\n` +
                        `🚀 *طلب جديد*\n` +
                        `👤 *رقم الطلب:* ${currentCount}\n` +
                        `📱 *معرف الجهاز:* \`${deviceId}\`\n` +
                        `🔗 *لينك المنشور:*\n\`${cleanLink}\`\n` +
                        `😍 *نوع رياكت:* ${selectedEmojis.join(", ")}\n` +
                        `⏰ *وقت الاستخدام:* ${timeString}`;
    
    const params = new URLSearchParams({
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown'
    });

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?${params.toString()}`;

    try {
      await fetch(url, { mode: 'no-cors' });
      
      localStorage.setItem('besoo_user_request_count', currentCount.toString());
      
      showToast(t.final.toast.sent, "success");
      
      // 20 دقيقة = 1200 ثانية
      const duration = 1200;
      const endTime = Date.now() + duration * 1000;
      
      // حفظ باستخدام النظام الآمن (لن يتم الحفظ إذا كان أدمن بفضل التعديل في App.tsx)
      SecureStorage.setItem(endTime.toString());
      
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
        
        {/* Security Badge */}
        <div className="flex items-center gap-2 mb-6 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-xs font-bold tracking-wider uppercase">{t.final.ssl}</span>
        </div>

        <h1 className="text-3xl font-black mb-8 text-yellow-400 tracking-wide">{t.home.title}</h1>

        <div className="w-full relative mb-6">
            {/* Honeypot Field (Invisible to users, visible to bots) */}
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
            <div className="text-center w-full bg-black/60 p-6 rounded-2xl border-2 border-gray-800">
                <div className="text-base text-orange-500 font-black mb-2 uppercase tracking-wider">{t.final.wait}</div>
                <div className="text-4xl text-white font-black font-mono tracking-widest" dir="ltr">{formatTime(timeLeft)}</div>
            </div>
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