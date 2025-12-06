import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, GlobeLock, LogIn, MousePointer2, PlayCircle, BarChart3, Clock } from 'lucide-react';
import { useAppConfig } from '../store';

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { lang } = useAppConfig();

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

  const steps = [
    { 
        icon: <LogIn className="w-6 h-6 text-blue-400" />,
        title: "1️⃣ تسجيل الدخول", 
        desc: "سجّل دخولك من خلال حساب فيسبوك بسهولة وأمان، دون أي نشر تلقائي على صفحتك." 
    },
    { 
        icon: <MousePointer2 className="w-6 h-6 text-purple-400" />,
        title: "2️⃣ تحديد المنشور", 
        desc: "اختر المنشور أو الصورة التي تريد تعزيز ظهورها وزيادة التفاعل عليها." 
    },
    { 
        icon: <PlayCircle className="w-6 h-6 text-green-400" />,
        title: "3️⃣ تنفيذ العملية", 
        desc: "يبدأ النظام تلقائيًا في إرسال الإعجابات والتفاعلات المطلوبة فوراً." 
    },
    { 
        icon: <BarChart3 className="w-6 h-6 text-yellow-400" />,
        title: "4️⃣ مشاهدة النتائج", 
        desc: "راقب تفاعل منشوراتك يرتفع بشكل ملموس خلال دقائق معدودة!" 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 relative overflow-hidden flex flex-col h-full">
        
        <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-yellow-400 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                🌐 كيف يعمل Besoo Liker؟
            </h1>
            <p className="text-gray-400 font-bold text-sm">خطوات بسيطة لزيادة تفاعلك</p>
        </div>

        <div className="space-y-4 mb-8" dir="rtl">
            {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-all">
                    <div className="mt-1 bg-black/40 p-2 rounded-lg border border-white/5">
                        {step.icon}
                    </div>
                    <div className="text-right">
                        <h3 className="text-white font-black text-base mb-1">{step.title}</h3>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                            {step.desc}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        {/* Timer & Button */}
        <div className="mt-auto border-t border-white/10 pt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-black/40 px-6 py-2 rounded-full border border-blue-500/20">
                <Clock className={`w-5 h-5 text-blue-500 ${!canProceed ? 'animate-pulse' : ''}`} />
                <span className="text-blue-500 font-black font-mono text-xl">
                    {canProceed ? '0' : timeLeft}
                </span>
                <span className="text-gray-500 text-xs font-bold uppercase">Seconds</span>
            </div>

            <button 
                onClick={handleNextClick}
                disabled={!canProceed}
                className={`w-full max-w-md py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                    canProceed ? 'bg-blue-500 text-white hover:bg-blue-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
            >
                {canProceed ? "اضغط هنا للمتابعة" : "يرجى الانتظار..."}
                {canProceed && <ArrowLeft className="w-6 h-6 stroke-[3px]" />}
            </button>
        </div>

      </div>
    </motion.div>
  );
};

export default FAQPage;