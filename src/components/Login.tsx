import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError('Firebase não configurado. Adicione as credenciais no .env');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary-fixed/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary-container/30 blur-[130px] pointer-events-none" />

      {/* Floating premium card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xl bg-white/75 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl p-8 md:p-14 text-center z-10 flex flex-col items-center"
      >
        {/* Centered logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 flex items-center justify-center w-full"
        >
          <img 
            src="/logo-alchemist-web.png" 
            alt="Alchemist Logo" 
            className="w-64 md:w-80 h-auto object-contain drop-shadow-sm select-none"
          />
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-3xl font-serif font-bold text-primary mb-3"
        >
          Bem-vindo ao Alchemist WEB
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-scientific-gray text-sm md:text-base mb-10 max-w-sm"
        >
          Gerenciamento inteligente de saúde, planejamento alimentar e receitas exclusivas para sua família.
        </motion.p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-error/10 text-error p-4 rounded-xl mb-6 text-sm w-full text-left border border-error/25"
          >
            {error}
          </motion.div>
        )}

        {/* Login Button */}
        <motion.button 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full max-w-xs flex items-center justify-center gap-3 bg-primary hover:bg-primary-container text-white py-4 px-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 cursor-pointer text-sm"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Entrar com o Google
            </>
          )}
        </motion.button>
 
        {/* Revision Number */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-3 text-[10px] font-sans font-semibold tracking-wider text-scientific-gray/60 uppercase"
        >
          Revisão: v4.3.0
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-xs text-scientific-gray/55 font-medium"
        >
          © {new Date().getFullYear()} Alchemist. Todos os direitos reservados.
        </motion.div>
      </motion.div>
    </div>
  );
}
