import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useAppConfig } from '../store';

const AdPlaceholder = ({ title }: { title: string }) => (
    <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg h-32 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-2 right-2 bg-zinc-800 text-zinc-500 text-[10px] px-2 py-0.5 rounded">Ad</div>
        <div className="text-zinc-600 font-bold text-sm uppercase tracking-widest group-hover:text-zinc-500 transition-colors">{title}</div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
    </div>
);

const InfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t, lang } = useAppConfig();

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
      sessionStorage.setItem('step1_completed', 'true');
      navigate('/step-2');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg"
    >
      <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-yellow-600/20 relative overflow-hidden flex flex-col items-center">
        
        {/* Header - Shortener Style */}
        <div className="w-full flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-2">
                 <LinkIcon className="w-5 h-5 text-yellow-500" />
                 <span className="font-black text-white text-lg tracking-wide">Besoo Liker</span>
             </div>
             <span className="text-xs font-bold bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                {t.shortener?.step1 || "Step 1/3"}
             </span>
        </div>

        {/* Content */}
        <div className="w-full text-center space-y-6">
            
            <h2 className="text-xl font-bold text-gray-200">
                {t.shortener?.prep || "Preparing your link..."}
            </h2>

            {/* Fake Ad 1 */}
            <AdPlaceholder title={t.shortener?.ad || "Sponsored Advertisement"} />

            {/* Timer Circle */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                    <circle 
                        cx="64" cy="64" r="56" 
                        stroke="currentColor" strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={351}
                        strokeDashoffset={351 - (351 * timeLeft) / 20}
                        className={`text-yellow-500 transition-all duration-1000 ease-linear ${timeLeft === 0 ? 'text-green-500' : ''}`}
                        strokeLinecap="round"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{timeLeft}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">{t.faq?.seconds}</span>
                 </div>
            </div>

            {/* Fake Ad 2 */}
            <AdPlaceholder title={t.shortener?.ad || "Sponsored Advertisement"} />

            {/* Action Button */}
            <div className="w-full pt-4">
                <button 
                    onClick={handleNextClick}
                    disabled={!canProceed}
                    className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        canProceed 
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                    {canProceed ? (t.shortener?.next || "Next Step") : (t.shortener?.wait || "Please Wait")}
                    {canProceed && (lang === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5 rotate-180" />)}
                </button>
            </div>

        </div>
      </div>
    </motion.div>
  );
};

export default InfoPage;