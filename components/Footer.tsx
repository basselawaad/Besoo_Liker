import React, { useState } from 'react';
import { Shield, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppConfig } from '../store';

const Footer: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const { t } = useAppConfig();

  // المنطق السري: الضغط 10 مرات لتفعيل الأدمن
  const handleSecretAdminClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 10) {
        // تشفير توكن الأدمن يدوياً
        const SALT = "besoo_secure_hash_x99_v4_ultra_strict";
        const token = btoa(`GRANTED|${SALT}|${navigator.userAgent.slice(0, 10)}`);
        
        // حفظ التوكن
        localStorage.setItem("__sys_root_privilege_token", token);
        
        // إزالة الحظر إن وجد لضمان دخول الأدمن فوراً
        localStorage.removeItem("__sys_access_violation_FINAL_v7");
        localStorage.removeItem("__sys_device_fp_v1");
        
        // إعادة تحميل الصفحة لتفعيل وضع الأدمن
        window.location.href = "/";
    }
  };

  return (
    <footer className="w-full bg-black border-t border-yellow-600 py-6 mt-auto relative z-40 select-none">
      <div className="container mx-auto px-4 text-center">
        
        {/* Privacy Policy Trigger */}
        <button 
          onClick={() => setShowPrivacy(true)}
          className="group flex items-center justify-center gap-2 mx-auto mb-4 px-5 py-2.5 rounded-full bg-yellow-400/5 hover:bg-yellow-400/10 border border-yellow-400/20 hover:border-yellow-400/50 transition-all duration-300"
        >
          <Shield className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-gray-200 text-base font-bold group-hover:text-yellow-400 transition-colors">{t.footer.privacy}</span>
        </button>

        <p className="text-yellow-600/80 text-sm font-bold flex items-center justify-center gap-1">
          {t.footer.rights} © 
          <span 
            onClick={handleSecretAdminClick}
            className="cursor-pointer select-none hover:text-yellow-500 transition-colors" 
            title="Admin Access"
          >
            2026
          </span> 
          <span className="text-yellow-400 font-black">Besoo Liker</span>
        </p>
      </div>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPrivacy(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              
              {/* Modal Content */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#1e293b] border border-yellow-600/30 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-black/40">
                    <h3 className="text-2xl font-black text-yellow-400 flex items-center gap-3">
                        <Lock className="w-7 h-7" />
                        {t.footer.modal.title}
                    </h3>
                    <button 
                        onClick={() => setShowPrivacy(false)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-7 h-7" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 text-gray-200">
                    
                    <div className="space-y-3">
                        <h4 className="text-white font-black text-xl flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                            {t.footer.modal.introTitle}
                        </h4>
                        <p className="text-base font-semibold leading-8 text-gray-300">
                           {t.footer.modal.introText}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-white font-black text-xl flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                            {t.footer.modal.collectTitle}
                        </h4>
                        <p className="text-base font-semibold leading-8 text-gray-300">
                           {t.footer.modal.collectText}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-white font-black text-xl flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                            {t.footer.modal.securityTitle}
                        </h4>
                        <p className="text-base font-semibold leading-8 text-gray-300">
                           {t.footer.modal.securityText}
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <h4 className="text-white font-black text-xl flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                            {t.footer.modal.disclaimerTitle}
                        </h4>
                        <p className="text-base font-semibold leading-8 text-gray-300">
                           {t.footer.modal.disclaimerText}
                        </p>
                    </div>

                    <div className="mt-6 p-5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                        <p className="text-yellow-200 text-base font-bold text-center">
                            {t.footer.modal.agree}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-gray-700 bg-black/40 flex justify-center">
                     <button 
                        onClick={() => setShowPrivacy(false)}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg py-4 px-12 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {t.footer.modal.close}
                    </button>
                </div>

              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;