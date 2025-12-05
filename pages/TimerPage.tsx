import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppConfig } from '../store';

const TimerPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { t } = useAppConfig();

  // Page 3 logic: Check if step 2 is completed
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
        // Store key for step 3 (Access to Destination)
        sessionStorage.setItem('step3_completed', 'true');
        navigate('/destination');
    }
  };

  const size = 100;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = ((20 - timeLeft) / 20) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 text-center relative flex flex-col h-full min-h-[500px]">
        
        {/* Header with Icon */}
        <div className="mb-4 flex-shrink-0 flex flex-col items-center">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/1533/1533913.png?v=2" 
              className="w-12 h-12 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
              alt="Besoo Liker Logo" 
            />
            <h1 className="text-3xl font-black text-yellow-400 mb-2">{t.home.title}</h1>
            <p className="text-gray-400 font-bold text-sm">{t.timer.finalStep}</p>
        </div>

        {/* Part 3: FAQ & CTA - Expanded */}
        <div className="flex-grow w-full overflow-y-auto mb-6 p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 text-right space-y-4 custom-scrollbar shadow-inner" dir="rtl">
            <div className="space-y-4">
                <h3 className="text-base font-black text-yellow-400 border-b border-yellow-600/20 pb-2">{t.timer.faqTitle}</h3>
                 <ul className="space-y-4 text-sm text-gray-300 font-medium">
                    <li className="bg-zinc-900/80 p-3 rounded-lg">
                        <p className="text-white font-bold mb-1 flex items-center gap-2"><span className="text-yellow-500">✔</span> {t.timer.q1}</p>
                        <p className="text-xs text-gray-400 pr-5">{t.timer.a1}</p>
                    </li>
                    <li className="bg-zinc-900/80 p-3 rounded-lg">
                        <p className="text-white font-bold mb-1 flex items-center gap-2"><span className="text-yellow-500">✔</span> {t.timer.q2}</p>
                        <p className="text-xs text-gray-400 pr-5">{t.timer.a2}</p>
                    </li>
                    <li className="bg-zinc-900/80 p-3 rounded-lg">
                        <p className="text-white font-bold mb-1 flex items-center gap-2"><span className="text-yellow-500">✔</span> {t.timer.q3}</p>
                        <p className="text-xs text-gray-400 pr-5">{t.timer.a3}</p>
                    </li>
                </ul>
                 {/* Only show 'Service Ready' when timer is done */}
                 {canProceed && (
                     <div className="pt-4 text-center border-t border-white/5 mt-2">
                         <p className="text-yellow-400 font-black text-sm animate-pulse">
                            {t.timer.ready}
                         </p>
                    </div>
                 )}
            </div>
        </div>

        {/* Circular Timer */}
        <div className="mb-6 relative flex flex-col items-center justify-center flex-shrink-0">
           <div className="relative" style={{ width: size, height: size }}>
             <svg className="w-full h-full transform -rotate-90">
               <circle cx={center} cy={center} r={radius} stroke="#27272a" strokeWidth={strokeWidth} fill="transparent" />
               <circle 
                 cx={center} 
                 cy={center} 
                 r={radius} 
                 strokeWidth={strokeWidth} 
                 fill="transparent"
                 strokeDasharray={circumference} 
                 strokeDashoffset={strokeDashoffset} 
                 strokeLinecap="round"
                 className="transition-all duration-1000 ease-linear stroke-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
               />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                {canProceed ? (
                    <CheckCircle className="w-10 h-10 text-green-500 fill-zinc-950" />
                ) : (
                    <span className="text-3xl font-black text-white">{timeLeft}</span>
                )}
             </div>
           </div>
        </div>

        <button 
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl flex-shrink-0 ${
                canProceed ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
        >
            {canProceed ? t.timer.buttonGet : t.timer.buttonPrep}
            {canProceed && <ArrowLeft className="w-6 h-6 rtl:block ltr:hidden stroke-[3px]" />}
        </button>

      </div>
    </motion.div>
  );
};

export default TimerPage;