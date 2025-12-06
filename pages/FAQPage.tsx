import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, ShieldCheck, Link as LinkIcon, HelpCircle, Check, LogIn, Image as ImageIcon, Play, BarChart } from 'lucide-react';
import { useAppConfig } from '../store';

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

  const steps = [
      { icon: LogIn, title: "1️⃣ تسجيل الدخول", desc: "سجّل دخولك من خلال حساب فيسبوك بسهولة وأمان." },
      { icon: ImageIcon, title: "2️⃣ تحديد المنشور", desc: "اختر المنشور أو الصورة التي تريد تعزيز ظهورها." },
      { icon: Play, title: "3️⃣ تنفيذ العملية", desc: "يبدأ النظام تلقائيًا في إرسال الإعجابات." },
      { icon: BarChart, title: "4️⃣ مشاهدة النتائج", desc: "راقب تفاعل منشوراتك يرتفع بشكل ملموس!" }
  ];

  const faqs = [
      { q: "هل Besoo Liker آمن؟", a: "نعم، فهو يعتمد بروتوكولات أمان قوية لحماية بياناتك." },
      { q: "هل التفاعلات حقيقية؟", a: "تمامًا، جميع الإعجابات تأتي من مستخدمين حقيقيين." },
      { q: "هل يمكنني اختيار منشورات معينة؟", a: "نعم، يمكنك التحكم الكامل في اختيار المنشور." },
      { q: "كم من الوقت يستغرق وصول الإعجابات؟", a: "في العادة ستظهر خلال دقائق قليلة فقط." },
      { q: "هل يتطلب تثبيت برنامج؟", a: "لا، النظام يعمل من خلال الويب فقط دون أي تحميل." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="flex flex-col items-center mb-6">
         <h1 className="text-4xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] tracking-wide">Besoo Liker</h1>
         <p className="text-gray-400 text-sm font-bold tracking-widest mt-1">SECURITY CHECK</p>
      </div>

      <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-blue-500/20 relative overflow-hidden flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-2">
                 <LinkIcon className="w-5 h-5 text-blue-500" />
                 <span className="font-bold text-gray-300 text-sm tracking-wide">Verification</span>
             </div>
             <span className="text-xs font-black bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/20">
                {t.shortener?.step2 || "Step 2/3"}
             </span>
        </div>

        {/* --- How It Works --- */}
        <div className="w-full mb-8">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🌐 كيف يعمل Besoo Liker؟
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {steps.map((s, i) => (
                    <div key={i} className="bg-zinc-900/40 p-3 rounded-lg flex items-start gap-3 border border-white/5">
                        <s.icon className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                        <div>
                            <h4 className="font-bold text-white text-sm mb-1">{s.title}</h4>
                            <p className="text-xs text-gray-400">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- FAQ --- */}
        <div className="w-full mb-8">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                💬 الأسئلة الأكثر شيوعًا
            </h3>
            <div className="space-y-3">
                {faqs.map((f, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-3">
                        <p className="text-xs font-bold text-gray-300 mb-0.5">✔ {f.q}</p>
                        <p className="text-xs text-gray-500">{f.a}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Timer Box */}
        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                {timeLeft > 0 ? <RefreshCw className="w-4 h-4 animate-spin text-blue-500"/> : <ShieldCheck className="w-4 h-4 text-green-500"/>}
                <span className="text-gray-400 font-medium text-sm">{timeLeft > 0 ? (t.shortener?.generating || "Generating...") : (t.shortener?.secure || "Link Secure")}</span>
            </div>
            <div className="font-mono font-black text-2xl text-blue-500">
                00:{timeLeft.toString().padStart(2, '0')}
            </div>
        </div>

        {/* Action Button */}
        <div className="w-full">
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