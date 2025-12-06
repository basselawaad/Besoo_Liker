import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppConfig } from '../store';
import { supabase } from '../supabaseClient'; 

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useAppConfig();
  
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError(t.auth.errorEmpty);
      return;
    }

    if (password !== confirmPassword) {
        setError(t.auth.errorMatch);
        return;
    }

    setLoading(true);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
            }
        });

        if (error) throw error;

        // If session is null, it means email confirmation is required (Supabase default)
        // We switch to verification step to prompt user to check email or enter code
        if (data.user && !data.session) {
            setStep('verify');
        } else if (data.session) {
            // Logged in immediately (Email confirmation might be off)
            navigate('/');
        }

    } catch (err: any) {
        setError(err.message || 'Error signing up');
    } finally {
        setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
          const { data, error } = await supabase.auth.verifyOtp({
              email,
              token: otp,
              type: 'signup'
          });

          if (error) throw error;

          if (data.session) {
              navigate('/');
          }
      } catch (err: any) {
          setError(err.message || "Invalid Code");
      } finally {
          setLoading(false);
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg" // Wider for Google style
    >
      <div className="bg-zinc-950/90 backdrop-blur-md rounded-[28px] p-8 md:p-12 shadow-[0_0_40px_rgba(234,179,8,0.1)] border border-yellow-600/20 text-center relative overflow-hidden">
        
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />

        <div className="mb-6 flex flex-col items-center">
             <div className="w-16 h-16 mb-4 flex items-center justify-center">
                 <img src="https://cdn-icons-png.flaticon.com/512/1533/1533913.png?v=2" alt="Logo" className="w-12 h-12 object-contain" />
             </div>
             <h1 className="text-2xl font-black text-white tracking-wide">
                 {step === 'form' ? t.auth.signupTitle : t.auth.verifyTitle}
             </h1>
             <p className="text-gray-400 text-sm mt-2">
                 {step === 'form' ? "Create your Besoo Liker Account" : t.auth.verifyText}
             </p>
        </div>

        <AnimatePresence mode="wait">
        {step === 'form' ? (
            <motion.form 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSignup} 
                className="space-y-4" 
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="space-y-5">
                    <div className="relative group">
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder=" "
                            className="block px-4 py-3.5 w-full text-white bg-transparent rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer transition-colors"
                        />
                        <label className={`absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-zinc-950 px-2 peer-focus:px-2 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`}>
                            {t.auth.name}
                        </label>
                    </div>

                    <div className="relative group">
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                            className="block px-4 py-3.5 w-full text-white bg-transparent rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer transition-colors"
                        />
                         <label className={`absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-zinc-950 px-2 peer-focus:px-2 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`}>
                            {t.auth.email}
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder=" "
                                className="block px-4 py-3.5 w-full text-white bg-transparent rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer transition-colors"
                            />
                            <label className={`absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-zinc-950 px-2 peer-focus:px-2 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`}>
                                {t.auth.password}
                            </label>
                        </div>
                        <div className="relative group">
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder=" "
                                className="block px-4 py-3.5 w-full text-white bg-transparent rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer transition-colors"
                            />
                            <label className={`absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-zinc-950 px-2 peer-focus:px-2 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`}>
                                {t.auth.confirmPassword}
                            </label>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-400 text-sm flex items-center justify-start gap-2 pt-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between pt-6">
                    <Link to="/login" className="text-yellow-400 text-sm font-bold hover:bg-yellow-400/10 px-4 py-2 rounded-lg transition-colors">
                        {t.auth.haveAccount}
                    </Link>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-yellow-400 text-black font-bold py-2.5 px-8 rounded-full hover:bg-yellow-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? "..." : t.auth.signupBtn}
                    </button>
                </div>
            </motion.form>
        ) : (
            <motion.form
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerify}
                className="space-y-6"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 mb-4 flex items-center gap-3 text-left rtl:text-right">
                    <div className="bg-yellow-400/10 p-2 rounded-full">
                        <Mail className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">{email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">Check your inbox for the code</p>
                    </div>
                </div>

                <div className="relative group">
                    <input 
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder=" "
                        className="block px-4 py-3.5 w-full text-white bg-transparent rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer transition-colors tracking-[0.5em] text-center font-mono text-xl"
                        maxLength={6}
                    />
                    <label className="absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-zinc-950 px-2 peer-focus:px-2 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1/2 -translate-x-1/2 peer-focus:left-1/2 peer-focus:-translate-x-1/2">
                        G- Code
                    </label>
                </div>

                {error && (
                    <div className="text-red-400 text-sm flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 text-black font-bold py-3 rounded-full hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                    {loading ? "..." : t.auth.verifyBtn}
                </button>
                
                <div className="flex justify-between items-center mt-4">
                    <button type="button" onClick={() => setStep('form')} className="text-gray-500 text-sm hover:text-white transition-colors">
                        {lang === 'ar' ? 'تغيير البريد' : 'Change Email'}
                    </button>
                    {/* Note: Standard Supabase resend is a bit different, often just calling signUp again works to resend */}
                    <button type="button" onClick={handleSignup} className="text-yellow-400 text-sm font-bold hover:underline">
                        {t.auth.resend}
                    </button>
                </div>
            </motion.form>
        )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

export default SignupPage;