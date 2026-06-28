import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase/config';
import { Login } from './components/Login';
import { userService } from './services/userService';
import { Profile } from './types';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered to clear cache');
    }
  });
}

function Root() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          let userFamilyId = await userService.getUserFamilyId(currentUser.uid);
          
          if (!userFamilyId) {
            // First login: create family and master profile
            const result = await userService.createFamilyForUser(currentUser.uid, {
              email: currentUser.email || "",
              name: currentUser.displayName || "Novo Usuário",
              avatar: currentUser.photoURL || undefined
            });
            userFamilyId = result.familyId;
          }
          
          setFamilyId(userFamilyId);
          
          // Load all members of the family
          const familyMembers = await userService.getFamilyMembers(userFamilyId);
          
          if (!familyMembers || familyMembers.length === 0) {
            setErrorMsg("Nenhum perfil encontrado para esta família. Verifique o banco de dados.");
          } else {
            setProfiles(familyMembers);
          }
          
        } catch (err: any) {
          console.error("Erro ao carregar família e perfis:", err);
          setErrorMsg("Erro de permissão ou conexão com o Firestore: " + (err.message || String(err)));
        }
      } else {
        setProfiles(null);
        setFamilyId(null);
        setErrorMsg(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm max-w-md">
          <h2 className="text-red-600 font-bold text-lg mb-2">Erro de Conexão</h2>
          <p className="text-sm text-gray-700 mb-4">{errorMsg}</p>
          <p className="text-xs text-gray-500">
            Se for um erro de permissão (Missing or insufficient permissions), vá ao Firebase Console &gt; Firestore Database &gt; Rules e permita leitura/escrita.
          </p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!user && auth) {
    return <Login />;
  }

  if (user && (!profiles || profiles.length === 0)) {
    // Caso Profiles esteja vazio mas sem erro (não deve acontecer com o novo tratamento)
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <App initialProfiles={profiles as Profile[]} familyId={familyId as string} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
