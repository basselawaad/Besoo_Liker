import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, MessageCircle, ExternalLink, ChevronDown, Check, ShieldCheck, Share2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppConfig, Lang } from '../store';

const languages: { code: Lang; name: string; flag: string }[] = [
  { code: 'ar', name: 'العربية', flag: '🇪🇬' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { lang, setLang, t, isAdmin } = useAppConfig();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  // Close lang menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangSelect = (code: Lang) => {
    setLang(code);
    setIsLangMenuOpen(false);
  };

  const handleShare = async () => {
      // SECURITY FIX: 
      // ننسخ فقط الرابط الرئيسي (الروت) لضمان أن أي شخص يفتح الرابط يبدأ من البداية
      // هذا يمنع تجاوز الخطوات عن طريق مشاركة رابط صفحة داخلية
      const urlToShare = window.location.origin;

      // Custom professional share message
      const shareTitle = lang === 'ar' ? 'زيادة لايكات فيسبوك مجاناً' : 'Free Facebook Likes';
      const shareText = lang === 'ar' 
        ? "🚀 أقوى موقع لزيادة لايكات فيسبوك مجاناً! \n💯 تفاعل حقيقي ومضمون 100% \n🔒 آمن تماماً وبدون كلمة سر \nجربه الآن 👇"
        : "🚀 Best site to increase Facebook Likes for FREE! \n💯 100% Real & Safe Engagement \n🔒 No Password Required \nTry it now 👇";

      const shareData = {
          title: shareTitle,
          text: shareText,
          url: urlToShare
      };

      // دالة مساعدة للنسخ القوي (تعمل على كل المتصفحات)
      const robustCopy = async (text: string) => {
          try {
              // المحاولة الأولى: API الحديث
              if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(text);
                  return true;
              }
              throw new Error("Clipboard API unavailable");
          } catch (err) {
              // المحاولة الثانية: الطريقة التقليدية (Fallback)
              try {
                  const textArea = document.createElement("textarea");
                  textArea.value = text;
                  
                  // تنسيق لإخفاء العنصر مع إبقائه جزءاً من الصفحة
                  textArea.style.position = "fixed";
                  textArea.style.left = "-9999px";
                  textArea.style.top = "0";
                  textArea.setAttribute('readonly', '');
                  
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  
                  const successful = document.execCommand('copy');
                  document.body.removeChild(textArea);
                  return successful;
              } catch (fallbackErr) {
                  return false;
              }
          }
      };

      // 2. محاولة المشاركة الأصلية (للموبايل)
      if (navigator.share) {
          try {
              await navigator.share(shareData);
              return; // تم بنجاح عبر قائمة المشاركة
          } catch (err) {
              // إذا ألغى المستخدم أو فشل، نكمل للنسخ اليدوي
          }
      }

      // 3. النسخ للحافظة (للحاسوب أو عند فشل المشاركة)
      // ننسخ الرابط مع نص قصير إذا كان نسخاً يدوياً
      const textToCopy = `${shareText}\n${urlToShare}`;
      const success = await robustCopy(textToCopy);
      
      if (success) {
          setShowCopyFeedback(true);
          setTimeout(() => setShowCopyFeedback(false), 2000);
      }
  };

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <header className="w-full bg-black border-b border-yellow-600 shadow-[0_4px_8px_rgba(255,255,0,0.1)] sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        
        {/* Left Section: Language Dropdown + Admin Badge */}
        <div className="flex items-center gap-3">
            <div className="relative z-50" ref={langMenuRef}>
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-yellow-600/30 text-yellow-400 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <span className="text-lg">{currentLang.flag}</span>
                <span className="font-bold text-sm hidden md:block">{currentLang.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute top-12 ${lang === 'ar' ? 'right-0' : 'left-0'} w-48 bg-[#0a0a0c] border border-yellow-600/40 rounded-xl shadow-2xl overflow-hidden py-1 z-50 max-h-[70vh] overflow-y-auto custom-scrollbar`}
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleLangSelect(l.code)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:bg-yellow-400/10 ${lang === l.code ? 'text-yellow-400 bg-yellow-400/5' : 'text-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{l.flag}</span>
                          <span>{l.name}</span>
                        </div>
                        {lang === l.code && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admin Badge */}
            {isAdmin && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <ShieldCheck className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-black text-xs uppercase tracking-wider">Admin</span>
                </div>
            )}
        </div>

        {/* Right Section: Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors z-50 focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-8 h-8 stroke-[3px]" /> : <Menu className="w-8 h-8 stroke-[3px]" />}
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
              />
              
              {/* Menu Content */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`absolute top-20 ${lang === 'ar' ? 'left-4' : 'right-4'} min-w-[220px] bg-[#1e293b] border border-yellow-600/50 rounded-xl shadow-2xl z-50 overflow-hidden`}
              >
                <div className="p-3 space-y-2">
                  {/* Mobile Admin Badge */}
                  {isAdmin && (
                    <div className="md:hidden flex items-center gap-2 p-3 mb-2 rounded-lg bg-yellow-400/10 border border-yellow-500/30">
                        <ShieldCheck className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-black text-sm uppercase">Admin Active</span>
                    </div>
                  )}

                  <a 
                    href="https://linktr.ee/BesooLike" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full p-4 text-yellow-400 hover:bg-yellow-400 hover:text-black rounded-lg transition-all duration-200 font-black text-base"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageCircle className="w-5 h-5 stroke-[2.5px]" />
                    <span>{t.header.contact}</span>
                    <ExternalLink className="w-4 h-4 rtl:mr-auto ltr:ml-auto opacity-70 stroke-[3px]" />
                  </a>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-3 w-full p-4 text-yellow-400 hover:bg-yellow-400 hover:text-black rounded-lg transition-all duration-200 font-black text-base mt-2"
                  >
                     {showCopyFeedback ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5 stroke-[2.5px]" />}
                     <span>{showCopyFeedback ? (lang === 'ar' ? 'تم نسخ الرابط' : 'Link Copied') : t.header.share}</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </header>
  );
};

export default Header;