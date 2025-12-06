import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAppConfig } from '../store';
import { supabase } from '../supabaseClient'; 

const FloatingInput = ({ 
  id, 
  type, 
  value, 
  onChange, 
  label, 
  dir = 'ltr' 
}: { 
  id: string, 
  type: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  label: string,
  dir?: 'ltr' | 'rtl'
}) => (
  <div className="relative group mb-4">
    <input 
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`block px-4 py-4 w-full text-white bg-transparent rounded border border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer transition-colors ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
    />
    <label 
        htmlFor={id}
        className={`absolute text-base text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-[#1e1e1e] px-2 peer-focus:px-2 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 ${dir === 'rtl' ? 'right-3 origin-top-right' : 'left-3 origin-top-left'}`}
    >
        {label}
    </label>
  </div>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useAppConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError(t.auth.errorEmpty); return; }

    setLoading(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes('Email not confirmed')) throw new Error("Please check your email to verify account.");
            throw error;
        }
        if (data.session) navigate('/');
    } catch (err: any) {
        setError(err.message || t.auth.errorInvalid);
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://besooliker.vercel.app/home' }
      });
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full px-4">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[450px] bg-[#1e1e1e] rounded-[28px] p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#303030] text-center"
        >
             <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 mb-4">
                     <svg viewBox="0 0 24 24" className="w-full h-full text-blue-500 fill-current">
                         <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                         <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                         <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                         <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                     </svg>
                </div>
                <h1 className="text-2xl font-normal text-white mb-2">{t.auth.loginTitle}</h1>
                <p className="text-base text-gray-400">{t.home.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full text-left">
                <FloatingInput id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} label={t.auth.email} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                <FloatingInput id="pass" type="password" value={password} onChange={e => setPassword(e.target.value)} label={t.auth.password} dir={lang === 'ar' ? 'rtl' : 'ltr'} />

                {error && <div className="text-red-500 text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

                <div className="flex justify-between items-center mt-8">
                     <Link to="/signup" className="text-blue-400 font-bold hover:bg-blue-500/10 px-4 py-2 rounded transition-colors text-sm">
                        {t.auth.signupTitle}
                    </Link>
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-8 rounded-full transition-all flex items-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
                        {t.auth.loginBtn}
                    </button>
                </div>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#1e1e1e] text-gray-500">OR</span></div>
                </div>

                <button type="button" onClick={handleGoogleSignIn} className="w-full bg-white text-black font-medium py-2.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-3">
                     <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                     {t.auth.googleBtn}
                </button>
            </form>
        </motion.div>
    </div>
  );
};

export default LoginPage;