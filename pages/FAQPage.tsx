import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { useAppConfig } from '../store';

const AdPlaceholder = ({ title, height = "h-24" }: { title: string, height?: string }) => (
    <div className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-lg ${height} flex flex-col items-center justify-center relative overflow-hidden group`}>
        <div className="absolute top-2 right-2 bg-zinc-800 text-zinc-500 text-[10px] px-2 py-0.5 rounded">Ad</div>
        <div className="text-zinc-600 font-bold text-sm uppercase tracking-widest group-hover:text-zinc-500 transition-colors">{title}</div>
    </div>
);

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t, lang } = useAppConfig();

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
      sessionStorage.setItem('step2_completed', 'true');
      navigate('/step-3');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-lg"
    >
      <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-blue-500/20 relative overflow-hidden flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-2">
                 <LinkIcon className="w-5 h-5 text-blue-500" />
                 <span className="font-black text-white text-lg tracking-wide">Besoo Liker</span>
             </div>
             <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/20">
                {t.shortener?.step2 || "Step 2/3"}
             </span>
        </div>

        {/* Status Bar */}
        <div className="w-full bg-zinc-900 rounded-full h-2 mb-6 overflow-hidden">
            <motion.div 
                initial={{ width: "33%" }}
                animate={{ width: "66%" }}
                transition={{ duration: 1 }}
                className="h-full bg-blue-500"
            />
        </div>

        <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
            {timeLeft > 0 ? (
                <>
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    {t.shortener?.generating || "Generating destination..."}
                </>
            ) : (
                <>
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    {t.shortener?.secure || "Secure Link Generated"}
                </>
            )}
        </h2>

        {/* Content Area */}
        <div className="w-full grid grid-cols-2 gap-4 mb-6">
             <AdPlaceholder title="Ad Space" height="h-32" />
             <AdPlaceholder title="Ad Space" height="h-32" />
        </div>

        {/* Timer Box */}
        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 w-full flex items-center justify-between mb-6">
            <span className="text-gray-400 font-medium text-sm">{t.shortener?.wait || "Please wait..."}</span>
            <div className="font-mono font-black text-2xl text-blue-500">
                00:{timeLeft.toString().padStart(2, '0')}
            </div>
        </div>

        <AdPlaceholder title={t.shortener?.ad || "Sponsored"} height="h-20" />

        {/* Action Button */}
        <div className="w-full pt-6">
            <button 
                onClick={handleNextClick}
                disabled={!canProceed}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    canProceed 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
            >
                {canProceed ? (t.shortener?.next || "Next Step") : (t.shortener?.wait || "Please Wait")}
                {canProceed && (lang === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5 rotate-180" />)}
            </button>
        </div>

      </div>
    </motion.div>
  );
};

export default FAQPage;