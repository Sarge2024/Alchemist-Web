import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase/config';
import { Login } from './components/Login';
import { userService } from './services/userService';
import { Profile } from './types';

registerSW({ immediate: true });

function Root() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          setProfiles(familyMembers);
          
        } catch (err) {
          console.error("Erro ao carregar família e perfis:", err);
        }
      } else {
        setProfiles(null);
        setFamilyId(null);
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

  if (!user && auth) {
    return <Login />;
  }

  if (user && (!profiles || profiles.length === 0)) {
    // Caso de erro no carregamento
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
