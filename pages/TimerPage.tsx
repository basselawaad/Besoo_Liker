import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ExternalLink, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg"
    >
      <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-green-500/20 relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-2">
                 <LinkIcon className="w-5 h-5 text-green-500" />
                 <span className="font-black text-white text-lg tracking-wide">Besoo Liker</span>
             </div>
             <span className="text-xs font-bold bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                {t.shortener?.step3 || "Final Step"}
             </span>
        </div>

        {/* Success Icon */}
        <div className="mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
            <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
            {canProceed ? (t.shortener?.ready || "Link is Ready!") : (t.shortener?.generating || "Finalizing...")}
        </h2>
        
        <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
            {canProceed ? "Click the button below to access the service." : "Please wait while we prepare the secure connection."}
        </p>

        {/* Big Counter */}
        {!canProceed && (
            <div className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-6 mb-8 flex flex-col items-center">
                <span className="text-5xl font-black font-mono text-white tracking-wider">
                    {timeLeft}
                </span>
                <span className="text-xs text-zinc-500 font-bold uppercase mt-2">{t.faq?.seconds}</span>
            </div>
        )}

        {/* Fake Ad Area */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg h-24 mb-8 flex items-center justify-center relative overflow-hidden">
             <span className="text-zinc-700 font-bold text-xs uppercase tracking-widest">{t.shortener?.ad || "Advertisement"}</span>
        </div>

        {/* Main Action Button */}
        <button 
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-5 rounded-xl font-black text-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                canProceed 
                ? 'bg-green-500 text-white hover:bg-green-400 hover:scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce-slight' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
        >
            {canProceed ? (
                <>
                    <Download className="w-6 h-6" />
                    {t.shortener?.get || "Get Link"}
                </>
            ) : (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.shortener?.wait || "Please Wait..."}
                </>
            )}
        </button>

      </div>
    </motion.div>
  );
};

export default TimerPage;