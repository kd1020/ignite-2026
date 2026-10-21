import React, { createContext, useContext, useState, useEffect } from
        'react';
        import { supabase } from '../lib/supabaseClient';


        const AuthContext = createContext(null);


        export function AuthProvider({ children }) {
          const [user, setUser] = useState(null);
          const [session, setSession] = useState(null);
          const [adminProfile, setAdminProfile] = useState(null);
          const [loading, setLoading] = useState(true);
          const [authError, setAuthError] = useState(null);


          // Check admin role against public.admin_users table in PostgreSQL
          async function fetchAdminProfile(userId) {
            try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, full_name, role, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();


      if (error || !data) {
        setAdminProfile(null);
        return null;
      }
      setAdminProfile(data);
      return data;
    } catch (err) {
      console.error('[AuthContext] Admin profile lookup failure:', err);
      setAdminProfile(null);
      return null;
    }
  }


  useEffect(() => {
    // 1. Initial Session Check
    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await
supabase.auth.getSession();
        if (error) throw error;


        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchAdminProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error('[AuthContext] Session retrieval error:', err);
      } finally {
        setLoading(false);
      }
    }


    initAuth();
    // 2. Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);


      if (currentSession?.user) {
        await fetchAdminProfile(currentSession.user.id);
      } else {
        setAdminProfile(null);
      }
      setLoading(false);
    });


    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  // Admin Login Action
  async function login(email, password) {
    setAuthError(null);
    setLoading(true);


    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });


      if (error) throw error;


      // Verify that this user exists in public.admin_users
      const profile = await fetchAdminProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Access Denied: Your account is not authorized as an IGNITE 2026 Administrator.');
      }
      return { success: true, profile };
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }


  // Logout Action
  async function logout() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAdminProfile(null);
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setLoading(false);
    }
  }


  const value = {
    user,
    session,
    adminProfile,
    isAdmin: Boolean(adminProfile && adminProfile.is_active),
    isSuperAdmin: Boolean(adminProfile && adminProfile.role ===
'super_admin' && adminProfile.is_active),
    loading,
    authError,
    login,
    logout
  };


  return <AuthContext.Provider value={value}>{children}
</AuthContext.Provider>;
}
        export function useAuth() {
          const context = useContext(AuthContext);
          if (!context) {
            throw new Error('useAuth must be utilized within an         <AuthProvider>');
          }
          return context;
        }
