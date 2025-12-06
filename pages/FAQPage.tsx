import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Link2, GlobeLock } from 'lucide-react';
import { useAppConfig } from '../store';

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t } = useAppConfig();

  // Step 2 Logic: Check if step 1 is completed
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

  const handleNextClick = () => {
    if (canProceed) {
      // Register Step 2 completion
      sessionStorage.setItem('step2_completed', 'true');
      navigate('/step-3');
    }
  };

  const progress = ((20 - timeLeft) / 20) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 text-center relative overflow-hidden flex flex-col h-full min-h-[480px]">
        
        {/* Header - Main Name */}
        <div className="mb-6 border-b border-yellow-600/30 pb-4 flex flex-col items-center">
            <h1 className="text-3xl font-black text-yellow-400 tracking-tighter mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {t.home.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold bg-zinc-900/50 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                <Link2 className="w-3 h-3" />
                <span>{t.faq.pageNum}</span>
            </div>
        </div>

        {/* Content - Shortener Style Step 2 */}
        <div className="flex-grow flex flex-col items-center justify-center space-y-8 mb-6">
            
            {/* Timer Circle */}
            <div className="relative w-36 h-36 flex items-center justify-center">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="66" stroke="#27272a" strokeWidth="8" fill="transparent" />
                    <circle 
                        cx="72" cy="72" r="66" strokeWidth="8" fill="transparent"
                        strokeDasharray={2 * Math.PI * 66}
                        strokeDashoffset={2 * Math.PI * 66 - (progress / 100) * 2 * Math.PI * 66}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000 ease-linear stroke-current drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                 </svg>
                 
                 <div className="flex flex-col items-center z-10">
                    <span className="text-5xl font-black text-white">{timeLeft}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Seconds</span>
                 </div>
            </div>

            <div className="space-y-3 w-full">
                 <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <GlobeLock className={`w-5 h-5 text-blue-500 ${!canProceed ? 'animate-pulse' : ''}`} />
                    <span>{t.faq.checking}</span>
                 </h2>
                 <p className="text-gray-400 text-sm font-medium">
                    Verifying secure connection to the destination server...
                 </p>
                 
                 {/* Fake Progress Bar */}
                 <div className="mx-auto w-full max-w-[280px] bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: canProceed ? "100%" : "85%" }}
                        transition={{ duration: 20, ease: "linear" }}
                        className="h-full bg-blue-500"
                    />
                 </div>
            </div>

        </div>

        {/* Button */}
        <button 
            onClick={handleNextClick}
            disabled={!canProceed}
            className={`w-full py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                canProceed ? 'bg-blue-500 text-white hover:bg-blue-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
        >
            {canProceed ? t.faq.buttonProceed : t.faq.buttonWait}
            {canProceed && (
                <>
                    <ArrowLeft className="w-6 h-6 rtl:block ltr:hidden stroke-[3px]" />
                    <ArrowLeft className="w-6 h-6 rtl:hidden ltr:block transform rotate-180 stroke-[3px]" />
                </>
            )}
        </button>

      </div>
    </motion.div>
  );
};

export default FAQPage;