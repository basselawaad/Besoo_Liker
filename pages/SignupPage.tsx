import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useAppConfig();
  
  // Steps: 0 = Info, 1 = Password, 2 = Verify
  const [step, setStep] = useState(0); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Timer for resend code
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateStep0 = () => {
      if (!name || !email) return t.auth.errorEmpty;
      if (!email.includes('@')) return t.auth.errorInvalid;
      return null;
  };

  const validateStep1 = () => {
      if (!password || !confirmPassword) return t.auth.errorEmpty;
      if (password !== confirmPassword) return t.auth.errorMatch;
      if (password.length < 6) return "Password must be at least 6 characters";
      return null;
  };

  const handleNext = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if (step === 0) {
          const err = validateStep0();
          if (err) { setError(err); return; }
          setStep(1);
      } else if (step === 1) {
          const err = validateStep1();
          if (err) { setError(err); return; }
          handleSignup();
      }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) throw error;

        // If no session, it means verify email is required
        if (data.user && !data.session) {
            setStep(2);
            setTimer(60); // Start 60s timer
        } else if (data.session) {
            navigate('/');
        }
    } catch (err: any) {
        if (err.message.includes('sending confirmation email')) {
             setError("Email limit reached. Please try logging in if you already have an account, or wait a while.");
        } else {
             setError(err.message || 'Error signing up');
        }
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
          if (data.session) navigate('/');
      } catch (err: any) {
          setError(err.message || "Invalid Code");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full px-4">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[450px] bg-[#1e1e1e] rounded-[28px] p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#303030] text-center"
        >
            {/* Logo Area */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 mb-4">
                     <svg viewBox="0 0 24 24" className="w-full h-full text-blue-500 fill-current">
                         <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                         <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                         <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                         <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                     </svg>
                </div>
                <h1 className="text-2xl font-normal text-white mb-2">
                    {step === 2 ? t.auth.verifyTitle : t.auth.signupTitle}
                </h1>
                <p className="text-base text-gray-400">
                    {step === 2 ? `Sent to ${email}` : t.home.title}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.form 
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleNext}
                        className="w-full text-left"
                    >
                        <FloatingInput id="name" type="text" value={name} onChange={e => setName(e.target.value)} label={t.auth.name} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                        <FloatingInput id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} label={t.auth.email} dir={lang === 'ar' ? 'rtl' : 'ltr'} />

                        {error && <div className="text-red-500 text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
                        
                        <div className="flex items-center justify-between mt-8">
                            <Link to="/login" className="text-blue-400 font-bold hover:bg-blue-500/10 px-4 py-2 rounded transition-colors text-sm">
                                {t.auth.loginBtn}
                            </Link>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-8 rounded-full transition-all">
                                {t.auth.signupBtn}
                            </button>
                        </div>
                    </motion.form>
                )}

                {step === 1 && (
                    <motion.form 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleNext}
                        className="w-full text-left"
                    >
                        {/* User Email Badge */}
                        <div className="flex justify-center mb-6">
                            <div className="border border-gray-600 rounded-full px-4 py-1 flex items-center gap-2 text-sm text-gray-300 bg-[#252525]">
                                <User className="w-4 h-4" />
                                {email}
                            </div>
                        </div>

                        <FloatingInput id="pass" type="password" value={password} onChange={e => setPassword(e.target.value)} label={t.auth.password} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                        <FloatingInput id="conf" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} label={t.auth.confirmPassword} dir={lang === 'ar' ? 'rtl' : 'ltr'} />

                        {error && <div className="text-red-500 text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

                        <div className="flex items-center justify-between mt-8">
                            <button type="button" onClick={() => setStep(0)} className="text-blue-400 font-bold hover:bg-blue-500/10 px-4 py-2 rounded transition-colors text-sm">
                                {lang === 'ar' ? 'رجوع' : 'Back'}
                            </button>
                            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-8 rounded-full transition-all flex items-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
                                {t.auth.signupBtn}
                            </button>
                        </div>
                    </motion.form>
                )}

                {step === 2 && (
                    <motion.form 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleVerify}
                        className="w-full text-left"
                    >
                        <p className="text-gray-400 text-sm mb-6 text-center">
                            Google-style verification code sent. Please check your spam folder.
                        </p>

                        <FloatingInput id="otp" type="text" value={otp} onChange={e => setOtp(e.target.value)} label="Enter 6-digit Code" dir="ltr" />

                        {error && <div className="text-red-500 text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

                        <div className="flex items-center justify-between mt-8">
                             <button 
                                type="button" 
                                disabled={timer > 0} 
                                onClick={handleSignup} // Resend trigger
                                className={`text-sm font-bold ${timer > 0 ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300'}`}
                             >
                                {timer > 0 ? `Resend in ${timer}s` : t.auth.resend}
                             </button>
                            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-8 rounded-full transition-all flex items-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
                                {t.auth.verifyBtn}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </motion.div>
    </div>
  );
};

export default SignupPage;