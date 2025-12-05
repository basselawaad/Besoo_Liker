import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAppConfig } from '../store';

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t } = useAppConfig();

  // Page 2 logic: Check if step 1 is completed
  useEffect(() => {
    if (!sessionStorage.getItem('step1_completed')) {
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
        // Store key for step 2
        sessionStorage.setItem('step2_completed', 'true');
        navigate('/step-3');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-md"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 text-center relative overflow-hidden flex flex-col h-full min-h-[500px]">
        
        {/* Header Dark/Yellow with Icon */}
        <div className="mb-6 border-b border-yellow-600/30 pb-4 flex-shrink-0 flex flex-col items-center">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/1533/1533913.png?v=2" 
              className="w-12 h-12 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
              alt="Besoo Liker Logo" 
            />
            <h1 className="text-3xl font-black text-yellow-400 tracking-tighter">{t.home.title}</h1>
            <p className="text-gray-400 font-bold text-sm mt-1">{t.faq.pageNum}</p>
        </div>

        {/* Part 2: How it works - Expanded */}
        <div className="flex-grow w-full overflow-y-auto mb-6 p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 text-right space-y-5 custom-scrollbar shadow-inner" dir="rtl">
            <div className="space-y-4">
                <h3 className="text-lg font-black text-yellow-400 border-b border-yellow-600/20 pb-2">{t.faq.title}</h3>
                <ul className="space-y-4 text-sm text-gray-300 font-medium">
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                        <span className="bg-yellow-500/20 text-yellow-400 w-8 h-8 flex items-center justify-center rounded-full text-base font-black flex-shrink-0">1</span>
                        <div>
                            <span className="text-white font-bold block mb-1 text-base">{t.faq.step1Title}</span>
                            <span className="text-xs text-gray-400 leading-relaxed">{t.faq.step1Desc}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                        <span className="bg-yellow-500/20 text-yellow-400 w-8 h-8 flex items-center justify-center rounded-full text-base font-black flex-shrink-0">2</span>
                        <div>
                            <span className="text-white font-bold block mb-1 text-base">{t.faq.step2Title}</span>
                            <span className="text-xs text-gray-400 leading-relaxed">{t.faq.step2Desc}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                        <span className="bg-yellow-500/20 text-yellow-400 w-8 h-8 flex items-center justify-center rounded-full text-base font-black flex-shrink-0">3</span>
                        <div>
                            <span className="text-white font-bold block mb-1 text-base">{t.faq.step3Title}</span>
                            <span className="text-xs text-gray-400 leading-relaxed">{t.faq.step3Desc}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                        <span className="bg-yellow-500/20 text-yellow-400 w-8 h-8 flex items-center justify-center rounded-full text-base font-black flex-shrink-0">4</span>
                        <div>
                            <span className="text-white font-bold block mb-1 text-base">{t.faq.step4Title}</span>
                            <span className="text-xs text-gray-400 leading-relaxed">{t.faq.step4Desc}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        {/* Timer Bar */}
        <div className="mb-8 flex-shrink-0">
            {!canProceed && (
                <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400 font-bold text-sm">{t.faq.checking}</span>
                    <span className="text-yellow-400 font-black text-xl">{timeLeft} {t.faq.seconds}</span>
                </div>
            )}
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700">
                <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 20, ease: "linear" }}
                    className="bg-yellow-400 h-full rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                />
            </div>
        </div>

        <button 
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl flex-shrink-0 ${
                canProceed ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
        >
            {canProceed ? (
                <>
                    <span>{t.faq.buttonProceed}</span>
                    <ArrowLeft className="w-5 h-5 rtl:block ltr:hidden stroke-[3px]" />
                    <ArrowLeft className="w-5 h-5 rtl:hidden ltr:block transform rotate-180 stroke-[3px]" />
                </>
            ) : (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                    <span>{t.faq.buttonWait}</span>
                </div>
            )}
        </button>

      </div>
    </motion.div>
  );
};

export default FAQPage;