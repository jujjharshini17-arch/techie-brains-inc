import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getProfile, upsertProfile } from '../lib/supabase';

const AuthContext = createContext({
  session: null,
  profile: null,
  setProfile: () => {},
  loading: true,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to build a fallback profile object if one doesn't exist
  const buildProfile = (user) => ({
    id: user.id,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Techie Brains User',
    email: user.email,
    phone: user.user_metadata?.phone || '',
    role: 'User'
  });

  const loadProfile = async (user) => {
    try {
      let data = await getProfile(user.id);
      if (!data) {
        data = await upsertProfile(buildProfile(user));
      }
      return data;
    } catch (e) {
      console.error('Failed to load profile:', e);
      return buildProfile(user);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Clear old mock local storage keys if present to prevent auth conflicts
        localStorage.removeItem('mock_token');
        localStorage.removeItem('user_role');

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        let currentSession = null;
        if (code) {
          console.log('Exchanging auth code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange failed:', error);
            const { data: { session } } = await supabase.auth.getSession();
            currentSession = session;
          } else {
            currentSession = data.session;
            // Clear code from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            window.history.replaceState({}, document.title, url.pathname + url.search);
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          currentSession = session;
        }

        if (currentSession?.user) {
          if (mounted) setSession(currentSession);
          const currentProfile = await loadProfile(currentSession.user);
          if (mounted) setProfile(currentProfile);
        } else {
          if (mounted) {
            setSession(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Initial session fetch error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (!newSession?.user) {
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setSession(newSession);
      const newProfile = await loadProfile(newSession.user);
      if (mounted) {
        setProfile(newProfile);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, setProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
