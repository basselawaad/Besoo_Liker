import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircleQuestion, HelpCircle, Check, Timer } from 'lucide-react';
import { useAppConfig } from '../store';

const TimerPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t, lang } = useAppConfig();

  useEffect(() => {
    if (!sessionStorage.getItem('step2_completed')) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanProceed(true);
    }
  }, [timeLeft]);

  const handleNext = () => {
    if (canProceed) {
        sessionStorage.setItem('step3_completed', 'true');
        navigate('/destination');
    }
  };

  const faqs = [
    { q: t.timer.q1, a: t.timer.a1 },
    { q: t.timer.q2, a: t.timer.a2 },
    { q: t.timer.q3, a: t.timer.a3 },
    { q: t.timer.q4, a: t.timer.a4 },
    { q: t.timer.q5, a: t.timer.a5 },
    { q: t.timer.q6, a: t.timer.a6 },
    { q: t.timer.q7, a: t.timer.a7 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 relative overflow-hidden flex flex-col h-full">
        
        <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-yellow-400 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {t.timer.faqTitle}
            </h1>
        </div>

        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {faqs.map((item, idx) => (
                <div key={idx} className="bg-zinc-900/80 p-4 rounded-xl border border-white/5">
                    <h3 className="text-yellow-400 font-bold text-sm mb-1 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        {item.q}
                    </h3>
                    <p className="text-gray-300 text-xs leading-relaxed font-medium px-1">
                        {item.a}
                    </p>
                </div>
            ))}
        </div>
        
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-4 rounded-xl border border-yellow-500/30 text-center mb-6">
            <h2 className="text-white font-black text-lg">{t.timer.ctaTitle}</h2>
            <p className="text-gray-300 text-xs mt-1">{t.timer.ctaDesc}</p>
        </div>

        {/* Timer & Button */}
        <div className="mt-auto border-t border-white/10 pt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-black/40 px-6 py-2 rounded-full border border-green-500/20">
                <Timer className={`w-5 h-5 text-green-500 ${!canProceed ? 'animate-pulse' : ''}`} />
                <span className="text-green-500 font-black font-mono text-xl">
                    {canProceed ? '0' : timeLeft}
                </span>
                <span className="text-gray-500 text-xs font-bold uppercase">{t.faq.seconds || "Seconds"}</span>
            </div>

            <button 
                onClick={handleNext}
                disabled={!canProceed}
                className={`w-full max-w-md py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                    canProceed ? 'bg-green-500 text-white hover:bg-green-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
            >
                {canProceed ? t.timer.buttonGet : t.faq.buttonWait}
                {canProceed && (
                    <>
                        {lang === 'ar' ? <ArrowLeft className="w-6 h-6 stroke-[3px]" /> : <ArrowLeft className="w-6 h-6 stroke-[3px] rotate-180" />}
                    </>
                )}
            </button>
        </div>

      </div>
    </motion.div>
  );
};

export default TimerPage;