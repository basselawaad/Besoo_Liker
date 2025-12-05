import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Zap, Timer, Lock, Server } from 'lucide-react';
import { useAppConfig, SecureStorage } from '../store';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppConfig();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // تنظيف الجلسة عند العودة للبداية لمنع أي تلاعب في الخطوات
  // هذا يضمن أن المستخدم يجب أن يبدأ من هنا دائماً
  useEffect(() => {
    sessionStorage.clear(); // مسح كل بيانات الجلسة السابقة
  }, []);

  // التحقق من العداد باستخدام النظام الآمن
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    // محاكاة الاتصال بالسيرفر للتحقق (تأخير مقصود لإيهام المستخدم بالحماية القصوى)
    const initCheck = setTimeout(() => {
        const checkTimer = () => {
          const savedEndTime = SecureStorage.getItem(); // استخدام المفتاح المشفر
          
          if (savedEndTime) {
            const endTime = parseInt(savedEndTime);
            if (!isNaN(endTime)) {
                // حساب الوقت المتبقي بناءً على التوقيت الحالي الفعلي
                // هذا يضمن أن العداد يستمر في النقصان حتى لو أغلق المستخدم الموقع
                const remaining = Math.floor((endTime - Date.now()) / 1000);
                
                if (remaining > 0) {
                  setTimeLeft(remaining);
                } else {
                  setTimeLeft(null);
                  SecureStorage.removeItem();
                }
            } else {
                // بيانات تالفة؟ امسحها
                SecureStorage.removeItem();
            }
          } else {
            setTimeLeft(null);
          }
          setIsChecking(false);
        };

        checkTimer(); // تشغيل فوري بعد انتهاء التأخير
        // تحديث كل ثانية
        intervalId = setInterval(checkTimer, 1000);

    }, 2000); 

    return () => {
        clearTimeout(initCheck);
        if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleStart = () => {
    if (timeLeft === null && !isChecking) {
      // تعيين مفتاح الجلسة النشط
      // هذا المفتاح ضروري للمرور من نظام الحظر في الصفحات التالية
      sessionStorage.setItem('session_active', 'true');
      navigate('/step-1');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_30px_rgba(234,179,8,0.1)] border border-yellow-600/40 text-center relative overflow-hidden">
        
        {/* App Icon Composition */}
        <div className="mb-6 mt-2 flex justify-center relative">
            <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-800 to-black rounded-[1.2rem] shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-white/10 flex items-center justify-center overflow-visible group">
                
                {/* Background Glow */}
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-600/40 blur-[25px] rounded-full pointer-events-none" 
                />

                {/* Main Image */}
                <motion.img
                  src="https://cdn-icons-png.flaticon.com/512/1533/1533913.png?v=2"
                  alt="Besoo Liker"
                  animate={{ 
                    y: [0, -6, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="z-10 w-12 h-12 object-contain drop-shadow-[0_8px_15px_rgba(59,130,246,0.5)]"
                />

                {/* Floating Emojis */}
                <motion.div 
                   animate={{ y: [0, -4, 0], x: [0, -3, 0], rotate: [0, -15, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-2 -left-2 text-xl drop-shadow-lg z-20 filter saturate-150"
                >
                   😍
                </motion.div>

                <motion.div 
                   animate={{ y: [0, 4, 0], x: [0, 3, 0], rotate: [0, 15, 0] }}
                   transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                   className="absolute -top-1 -right-3 text-xl drop-shadow-lg z-20 filter saturate-150"
                >
                   😆
                </motion.div>

                <motion.div 
                   animate={{ scale: [1, 1.25, 1], x: [0, 4, 0] }}
                   transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                   className="absolute top-1/2 -right-5 text-lg drop-shadow-lg z-20 filter saturate-150"
                >
                   😮
                </motion.div>

                <motion.div 
                   animate={{ scale: [1, 1.2, 1], y: [0, -3, 0], rotate: [0, -10, 0] }}
                   transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                   className="absolute -bottom-3 -left-1 text-xl drop-shadow-lg z-20 filter saturate-150"
                >
                   ❤️
                </motion.div>
                
                {/* Particles */}
                <motion.div 
                    animate={{ opacity: [0, 1, 0], y: [0, -10] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="absolute top-0 right-6 text-yellow-400 text-[10px]"
                >
                    ✨
                </motion.div>
            </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black mb-4 text-yellow-400 tracking-wide drop-shadow-sm">
          {t.home.title}
        </h1>
        <h2 className="text-lg md:text-xl text-gray-200 font-extrabold mb-6 tracking-wide">
          {t.home.subtitle}
        </h2>
        
        <div className="text-gray-300 text-sm md:text-lg font-bold mb-8 leading-relaxed max-w-lg mx-auto">
          <p>{t.home.desc}</p>
        </div>

        <div className="flex justify-center gap-6 mb-8 text-sm md:text-base font-black text-gray-300">
             <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                <span>{t.home.instant}</span>
             </div>
             <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>{t.home.safe}</span>
             </div>
        </div>

        {isChecking ? (
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm w-full md:w-auto mx-auto max-w-sm flex flex-col items-center"
             >
                <Server className="w-8 h-8 text-yellow-500 animate-pulse mb-3" />
                <p className="text-gray-300 font-bold text-sm">جاري تهيئة الاتصال...</p>
                <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                        className="bg-yellow-500 h-full"
                    />
                </div>
             </motion.div>
        ) : timeLeft !== null ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/60 border-2 border-red-500/30 rounded-2xl p-6 backdrop-blur-sm w-full md:w-auto mx-auto max-w-sm relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2 text-red-400">
                        <Lock className="w-5 h-5" />
                        <p className="font-bold text-base uppercase tracking-wider">
                            نظام الحماية نشط
                        </p>
                    </div>
                    <p className="text-gray-300 font-medium text-sm">يجب الانتظار قبل الطلب الجديد</p>
                    <div className="text-4xl font-mono font-black text-white tracking-widest flex items-center justify-center gap-3 bg-zinc-900 px-6 py-3 rounded-xl border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                         <Timer className="w-6 h-6 text-red-500 animate-spin-slow" style={{ animationDuration: '3s' }} />
                         {formatTime(timeLeft)}
                    </div>
                </div>
            </motion.div>
        ) : (
            <button 
              onClick={handleStart}
              className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-black text-black transition-all duration-200 bg-yellow-400 rounded-2xl hover:bg-yellow-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-105 w-full md:w-auto tracking-wide overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {t.home.start}
                <ArrowLeft className="mr-3 w-6 h-6 rtl:block ltr:hidden stroke-[3px]" />
                <ArrowLeft className="ml-3 w-6 h-6 rtl:hidden ltr:block transform rotate-180 stroke-[3px]" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
        )}
      </div>
    </motion.div>
  );
};

export default HomePage;