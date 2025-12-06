import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Star, ShieldCheck, Zap, MousePointerClick, Clock, Target, Users } from 'lucide-react';
import { useAppConfig } from '../store';

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

  const features = [
    { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: t.info.feat1Title, desc: t.info.feat1Desc },
    { icon: <ShieldCheck className="w-5 h-5 text-green-400" />, title: t.info.feat2Title, desc: t.info.feat2Desc },
    { icon: <MousePointerClick className="w-5 h-5 text-blue-400" />, title: t.info.feat3Title, desc: t.info.feat3Desc },
    { icon: <Clock className="w-5 h-5 text-red-400" />, title: t.info.feat4Title, desc: t.info.feat4Desc },
    { icon: <Target className="w-5 h-5 text-purple-400" />, title: t.info.feat5Title, desc: t.info.feat5Desc },
    { icon: <Users className="w-5 h-5 text-orange-400" />, title: t.info.feat6Title, desc: t.info.feat6Desc }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 relative overflow-hidden flex flex-col h-full">
        
        {/* Header Content */}
        <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-yellow-400 mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {t.info.welcomeTitle}
            </h1>
            <p className="text-white font-bold text-lg mb-4">{t.info.welcomeSub}</p>
            <p className="text-gray-300 text-sm leading-relaxed max-w-lg mx-auto font-medium">
                {t.info.welcomeDesc}
            </p>
        </div>

        {/* Features List */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {features.map((feat, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        {feat.icon}
                        <h3 className="font-bold text-yellow-200 text-sm">{feat.title}</h3>
                    </div>
                    <p className="text-gray-400 text-xs leading-5 font-medium">
                        {feat.desc}
                    </p>
                </div>
            ))}
        </div>

        {/* Timer & Button Area */}
        <div className="mt-auto border-t border-white/10 pt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-black/40 px-6 py-2 rounded-full border border-yellow-500/20">
                <Loader2 className={`w-5 h-5 text-yellow-400 ${!canProceed ? 'animate-spin' : ''}`} />
                <span className="text-yellow-400 font-black font-mono text-xl">
                    {canProceed ? '0' : timeLeft}
                </span>
                <span className="text-gray-500 text-xs font-bold uppercase">{t.faq.seconds || "Seconds"}</span>
            </div>

            <button 
                onClick={handleNextClick}
                disabled={!canProceed}
                className={`w-full max-w-md py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                    canProceed ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
            >
                {canProceed ? t.info.buttonReady : t.info.buttonWait}
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

export default InfoPage;