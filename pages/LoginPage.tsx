import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAppConfig } from '../store';
import { supabase } from '../supabaseClient'; // استدعاء عميل Supabase

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, login, lang } = useAppConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t.auth.errorEmpty);
      return;
    }

    setLoading(true);
    // Simulate network delay for regular login
    setTimeout(async () => {
        const success = await login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError(t.auth.errorInvalid);
            setLoading(false);
        }
    }, 1000);
  };

  // 💥 دالة تسجيل الدخول عبر جوجل باستخدام Supabase 💥
  const handleGoogleSignIn = async () => {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // العودة إلى الرابط المحدد في Google Cloud Console
            redirectTo: 'https://besooliker.vercel.app/home', 
        }
      });

      if (error) {
          console.error('Google login failed:', error.message);
          setError(error.message);
          setLoading(false);
      }
      // لا حاجة لـ setLoading(false) في حالة النجاح لأن Supabase سيعيد توجيه الصفحة
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-8 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-600/30 text-center">
        
        <div className="mb-6 flex justify-center">
            <div className="bg-yellow-400/10 p-4 rounded-full border border-yellow-400/30">
                <LogIn className="w-8 h-8 text-yellow-400" />
            </div>
        </div>

        <h1 className="text-2xl font-black text-yellow-400 mb-6">{t.auth.loginTitle}</h1>

        <form onSubmit={handleSubmit} className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.email}
                    className={`w-full bg-black/50 border border-gray-700 rounded-xl py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
            </div>
            
            <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.password}
                    className={`w-full bg-black/50 border border-gray-700 rounded-xl py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-2 rounded-lg flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-black font-black py-3 rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
                {loading ? t.system.loading : t.auth.loginBtn}
            </button>
            
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-500 font-bold bg-[#09090b]">OR</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.auth.googleBtn || "Sign in with Google"}
            </button>

        </form>

        <div className="mt-6 text-sm text-gray-400">
            {t.auth.noAccount} <Link to="/signup" className="text-yellow-400 font-bold hover:underline">{t.auth.signupBtn}</Link>
        </div>

      </div>
    </motion.div>
  );
};

export default LoginPage;