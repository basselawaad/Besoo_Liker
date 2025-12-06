import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, Star, Shield, Zap, MousePointerClick, Clock, Target } from 'lucide-react';
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
      { icon: Zap, title: "تفاعل فوري وسريع", desc: "احصل على إعجابات وتفاعلات حقيقية خلال لحظات! بمجرد تحديد المنشور، يبدأ النظام بإرسال التفاعل مباشرة." },
      { icon: Shield, title: "حماية وخصوصية موثوقة", desc: "نستخدم أحدث تقنيات التشفير لضمان أمان كامل لحسابك. لا نحفظ أي بيانات حساسة." },
      { icon: MousePointerClick, title: "واجهة سهلة وبسيطة", desc: "تصميم واضح وسهل الاستخدام يتيح لك أداء كل خطوة دون تعقيد." },
      { icon: Clock, title: "توفير وقت وجهد", desc: "بدلاً من المحاولات اليدوية، يقوم Besoo Liker بالمهمة نيابة عنك." },
      { icon: Target, title: "استهداف دقيق", desc: "اختر المنشورات التي تحتاج إلى تعزيز، واترك الخوارزمية تحدد أفضل توقيت." },
      { icon: Star, title: "تفاعل حقيقي 100%", desc: "لا حسابات وهمية أو روبوتات. جميع التفاعلات تأتي من مستخدمين فعليين." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl"
    >
      <div className="flex flex-col items-center mb-6">
         <h1 className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] tracking-wide">Besoo Liker</h1>
         <p className="text-gray-400 text-sm font-bold tracking-widest mt-1">SHORT LINK SERVICE</p>
      </div>

      <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-yellow-600/20 relative overflow-hidden flex flex-col items-center">
        
        {/* Header - Shortener Style */}
        <div className="w-full flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-2">
                 <LinkIcon className="w-5 h-5 text-yellow-500" />
                 <span className="font-bold text-gray-300 text-sm tracking-wide">Link Center</span>
             </div>
             <span className="text-xs font-black bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                {t.shortener?.step1 || "Step 1/3"}
             </span>
        </div>

        {/* --- Content: Intro --- */}
        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white mb-4">⭐ أهلاً بك في Besoo Liker – منصتك الأفضل لزيادة التفاعل!</h2>
            <p className="text-gray-300 leading-loose text-sm md:text-base font-medium">
                أصبح جذب الإعجابات والتفاعلات على فيسبوك أسهل من أي وقت مضى مع Besoo Liker، الأداة الذكية التي تم تطويرها لتساعدك على تعزيز ظهور منشوراتك بشكل آمن وفعّال. بفضل تقنيات متقدمة وتجربة استخدام سلسة، يمكنك رفع مستوى حضورك على وسائل التواصل الاجتماعي دون عناء أو تكلفة.
            </p>
        </div>

        {/* --- Content: Features Grid --- */}
        <h3 className="text-xl font-black text-yellow-500 mb-6 self-start w-full border-b border-zinc-800 pb-2">
            ⭐ مميزات تجعل Besoo Liker اختيارك الأول
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
            {features.map((f, i) => (
                <div key={i} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-yellow-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <f.icon className="w-5 h-5 text-yellow-500" />
                        <h4 className="font-bold text-white text-sm">{f.title}</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </div>

        {/* Timer Circle */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center my-4 mb-8">
                <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={251}
                    strokeDashoffset={251 - (251 * timeLeft) / 20}
                    className={`text-yellow-500 transition-all duration-1000 ease-linear ${timeLeft === 0 ? 'text-green-500' : ''}`}
                    strokeLinecap="round"
                />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{timeLeft}</span>
                <span className="text-[9px] text-gray-500 uppercase font-bold">{t.faq?.seconds}</span>
                </div>
        </div>

        {/* Action Button */}
        <div className="w-full">
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
    </motion.div>
  );
};

export default InfoPage;