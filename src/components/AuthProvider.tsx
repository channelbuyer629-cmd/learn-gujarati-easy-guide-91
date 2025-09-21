import React, { useEffect } from 'react';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();
  const { handleDailyLogin } = useAchievements(auth.user?.id);

  // Handle daily login rewards when user is authenticated
  useEffect(() => {
    if (auth.user && !auth.loading) {
      handleDailyLogin();
    }
  }, [auth.user, auth.loading]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};