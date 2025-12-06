import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Star, ShieldCheck, Zap, MousePointerClick, Clock, Target, Users } from 'lucide-react';
import { useAppConfig } from '../store';

const InfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [canProceed, setCanProceed] = useState(false);
  const { lang } = useAppConfig();

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
    { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: "تفاعل فوري وسريع", desc: "احصل على إعجابات وتفاعلات حقيقية خلال لحظات! بمجرد تحديد المنشور، يبدأ النظام بإرسال التفاعل مباشرة دون انتظار طويل." },
    { icon: <ShieldCheck className="w-5 h-5 text-green-400" />, title: "حماية وخصوصية موثوقة", desc: "يستخدم Besoo Liker أحدث تقنيات التشفير لضمان أمان كامل لحسابك. لا يقوم بحفظ أي بيانات حساسة." },
    { icon: <MousePointerClick className="w-5 h-5 text-blue-400" />, title: "واجهة سهلة وبسيطة", desc: "تم تصميم المنصة لتكون واضحة وسهلة الاستخدام لجميع الفئات، ما يتيح لك أداء كل خطوة دون تعقيد." },
    { icon: <Clock className="w-5 h-5 text-red-400" />, title: "توفير وقت وجهد", desc: "بدلاً من المحاولات اليدوية للحصول على التفاعل، يقوم Besoo Liker بالمهمة نيابة عنك." },
    { icon: <Target className="w-5 h-5 text-purple-400" />, title: "استهداف دقيق لمنشوراتك", desc: "اختر المنشورات التي تحتاج إلى تعزيز، واترك الخوارزمية الذكية تحدد أفضل توقيت." },
    { icon: <Users className="w-5 h-5 text-orange-400" />, title: "تفاعل حقيقي 100%", desc: "هنا لن تجد حسابات وهمية أو روبوتات. جميع التفاعلات تأتي من مستخدمين فعليين." }
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
                ⭐ أهلاً بك في Besoo Liker
            </h1>
            <p className="text-white font-bold text-lg mb-4">منصتك الأفضل لزيادة التفاعل!</p>
            <p className="text-gray-300 text-sm leading-relaxed max-w-lg mx-auto font-medium">
                أصبح جذب الإعجابات والتفاعلات على فيسبوك أسهل من أي وقت مضى مع Besoo Liker، الأداة الذكية التي تم تطويرها لتساعدك على تعزيز ظهور منشوراتك بشكل آمن وفعّال.
            </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-right rtl:text-right ltr:text-left" dir="rtl">
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
                <span className="text-gray-500 text-xs font-bold uppercase">Seconds</span>
            </div>

            <button 
                onClick={handleNextClick}
                disabled={!canProceed}
                className={`w-full max-w-md py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                    canProceed ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
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

export default InfoPage;