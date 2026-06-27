import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Alchemist WEB</h1>
        <p className="text-scientific-gray mb-8">Faça login para acessar a plataforma</p>
        
        {error && (
          <div className="bg-error/10 text-error p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-container text-white py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-70 cursor-pointer"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Entrar com Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
