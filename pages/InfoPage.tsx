import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { useAppConfig } from '../store';

const InfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t } = useAppConfig();

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
      // Page 1 logic: Register session start/completion
      sessionStorage.setItem('step1_completed', 'true');
      navigate('/step-2');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
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
            <p className="text-gray-400 font-bold text-sm mt-1">{t.info.pageNum}</p>
        </div>

        {/* Part 1: Intro & Features - Expanded */}
        <div className="flex-grow w-full overflow-y-auto mb-6 p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-6 custom-scrollbar shadow-inner">
            <div className="space-y-3">
                <h2 className="text-xl font-black text-yellow-400 text-center drop-shadow-sm">{t.info.welcomeTitle}</h2>
                <p className="text-gray-300 text-sm leading-relaxed font-semibold text-center px-2">
                    {t.info.welcomeDesc}
                </p>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-black text-yellow-400 border-b border-yellow-600/20 pb-2 text-center">{t.info.featuresTitle}</h3>
                
                {/* List items automatically align Start (Right for AR, Left for EN) due to global dir */}
                <ul className="space-y-3 text-sm text-gray-300 font-medium text-start">
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-colors">
                        <div className="bg-yellow-500/10 p-1 rounded-full shrink-0 mt-0.5">
                            <span className="text-yellow-500 text-xs">✔</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">{t.info.feat1Title}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{t.info.feat1Desc}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-colors">
                        <div className="bg-yellow-500/10 p-1 rounded-full shrink-0 mt-0.5">
                            <span className="text-yellow-500 text-xs">✔</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">{t.info.feat2Title}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{t.info.feat2Desc}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-colors">
                        <div className="bg-yellow-500/10 p-1 rounded-full shrink-0 mt-0.5">
                            <span className="text-yellow-500 text-xs">✔</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">{t.info.feat3Title}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{t.info.feat3Desc}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        {/* Timer Content */}
        <div className="flex flex-col items-center justify-center mb-6 flex-shrink-0">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-yellow-600/20 flex items-center justify-center bg-yellow-400/5">
                    {canProceed ? (
                         <CheckCircle className="w-10 h-10 text-yellow-400" />
                    ) : (
                        <span className="text-3xl font-black text-yellow-400 font-mono">{timeLeft}</span>
                    )}
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-md shadow-yellow-500/20">
                    <Clock className="w-4 h-4" />
                </div>
            </div>
        </div>

        {/* Button */}
        <button 
            onClick={handleNextClick}
            disabled={!canProceed}
            className={`w-full py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl flex-shrink-0 ${
                canProceed ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
        >
            {canProceed ? t.info.buttonReady : t.info.buttonWait}
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

export default InfoPage;