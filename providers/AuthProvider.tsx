import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

// Backend API URL
const API_BASE_URL = 'https://burg-dashboard.nl/api';

// Interface voor Auth context
interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

// Context aanmaken
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Custom hook om de Auth context te gebruiken
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth moet binnen een AuthProvider worden gebruikt');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Log status veranderingen voor debugging
  useEffect(() => {
    console.log('🔐 Auth state:', loading ? 'Laden...' : (user ? 'Ingelogd' : 'Uitgelogd'));
    if (user) {
      console.log('👤 Gebruiker:', user.email);
    }
  }, [user, loading]);

  // Volledig alle auth data verwijderen
  const clearAuthData = async () => {
    console.log('🧹 Opschonen van alle authenticatiegegevens...');
    
    try {
      // Haal alle keys op
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter op auth-gerelateerde keys
      const authKeys = keys.filter(key => 
        key.startsWith('supabase.') || 
        key.includes('auth') || 
        key.includes('token') ||
        key === 'authSession'
      );
      
      if (authKeys.length > 0) {
        console.log('🗑️ Verwijderen van auth sleutels:', authKeys);
        await AsyncStorage.multiRemove(authKeys);
      }
      
      // Reset state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
    } catch (error) {
      console.error('❌ Fout bij het opschonen van auth data:', error);
    }
  };

  // Haal toegangstoken op uit AsyncStorage
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('auth-token');
      return token;
    } catch (error) {
      console.error('❌ Fout bij ophalen token:', error);
      return null;
    }
  };

  // Refresh gebruikersgegevens via backend API
  const refreshUser = async () => {
    try {
      console.log('🔄 Vernieuwen gebruikersgegevens...');
      const token = await getAccessToken();
      
      if (!token) {
        console.log('❌ Geen token beschikbaar voor vernieuwen gebruiker');
        await clearAuthData();
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('❌ Fout bij ophalen gebruiker:', response.status);
        
        if (response.status === 401) {
          console.log('⚠️ Token verlopen, gebruiker uitloggen');
          await clearAuthData();
        }
        
        return;
      }
      
      const data = await response.json();
      
      if (data.user) {
        console.log('✅ Gebruikersgegevens vernieuwd:', data.user.email);
        setUser(data.user);
        setSession(data.session || null);
        
        // Controleer admin rol
        const isUserAdmin = data.user.app_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
      }
    } catch (error) {
      console.error('❌ Onverwachte fout bij vernieuwen gebruiker:', error);
    }
  };

  // Initialiseer auth state bij opstarten
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        console.log('🚀 Initialiseren authenticatiestatus...');
        
        // Haal token op uit AsyncStorage
        const token = await getAccessToken();
        
        if (!token) {
          console.log('❌ Geen token gevonden bij opstarten');
          await clearAuthData();
          setLoading(false);
          return;
        }
        
        // Controleer token geldigheid via backend
        const response = await fetch(`${API_BASE_URL}/auth/session`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('❌ Sessie fout:', response.status);
          await clearAuthData();
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.session) {
          console.log('✅ Geldige sessie gevonden');
          setSession(data.session);
          
          if (data.user) {
            console.log('👤 Gebruiker geladen:', data.user.email);
            setUser(data.user);
            
            // Controleer admin rol
            const isUserAdmin = data.user.app_metadata?.role === 'admin';
            setIsAdmin(isUserAdmin);
          }
        } else {
          console.log('❌ Geen geldige sessie gevonden');
          await clearAuthData();
        }
      } catch (error) {
        console.error('❌ Onverwachte fout bij initialisatie:', error);
        await clearAuthData();
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Login functie via backend API
  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 Inlogpoging voor:', email);
      
      // Maak schoon voordat we inloggen
      await clearAuthData();
      
      // Login via backend API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        let errorMsg = 'Inloggen mislukt. Probeer het opnieuw.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // Negeren als we geen JSON kunnen parsen
        }
        
        console.error('❌ Login fout:', errorMsg);
        return { success: false, error: errorMsg };
      }
      
      const data = await response.json();
      
      if (data.token && data.session && data.user) {
        console.log('✅ Login succesvol!');
        
        // Sla token op in AsyncStorage
        await AsyncStorage.setItem('auth-token', data.token);
        
        // Sla sessie en gebruiker op in state
        setSession(data.session);
        setUser(data.user);
        
        // Controleer admin rol
        const isUserAdmin = data.user.app_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Navigeer naar home pagina
        navigateToHome('Login succesvol');
        
        return { success: true };
      } else {
        console.log('❌ Geen sessie of token verkregen bij login');
        return { success: false, error: 'Kon geen sessie aanmaken. Probeer opnieuw.' };
      }
    } catch (error: any) {
      console.error('❌ Onverwachte login fout:', error);
      return { success: false, error: 'Er is een onverwachte fout opgetreden.' };
    }
  };

  // Logout functie via backend API
  const logout = async () => {
    try {
      console.log('🚪 Uitloggen...');
      setLoading(true);
      
      // Haal token op voor autorisatie
      const token = await getAccessToken();
      
      if (token) {
        // Logout op backend
        try {
          const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.error('❌ Uitlog fout op backend:', response.status);
          } else {
            console.log('✅ Backend uitloggen succesvol');
          }
        } catch (error) {
          console.error('❌ Fout bij uitloggen op backend:', error);
        }
      }
      
      // Verwijder alle auth data, ongeacht backend resultaat
      await clearAuthData();
      
      // Forceer navigatie naar login
      navigateToLogin('Uitgelogd');
    } catch (error) {
      console.error('❌ Onverwachte fout bij uitloggen:', error);
      Alert.alert('Uitloggen mislukt', 'Er is een onverwachte fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functie voor navigatie naar home
  const navigateToHome = (reason: string) => {
    console.log(`🏠 Navigeren naar home: ${reason}`);
    
    try {
      if (Platform.OS === 'web') {
        // Web: gebruik window.location voor een volledige refresh
        window.location.href = '/';
      } else {
        // Native: gebruik de router
        router.replace('/');
      }
    } catch (error) {
      console.error('❌ Navigatiefout naar home:', error);
      // Fallback
      setTimeout(() => {
        try {
          router.push('/');
        } catch (e) {
          console.error('❌ Fallback navigatie mislukt:', e);
        }
      }, 500);
    }
  };

  // Helper functie voor navigatie naar login
  const navigateToLogin = (reason: string) => {
    console.log(`🔐 Navigeren naar login: ${reason}`);
    
    try {
      if (Platform.OS === 'web') {
        // Web: gebruik window.location voor een volledige refresh
        window.location.href = '/login';
      } else {
        // Native: gebruik de router
        router.replace('/login');
      }
    } catch (error) {
      console.error('❌ Navigatiefout naar login:', error);
      // Fallback
      setTimeout(() => {
        try {
          router.push('/login');
        } catch (e) {
          console.error('❌ Fallback navigatie mislukt:', e);
        }
      }, 500);
    }
  };

  // Waarde voor de context
  const value = {
    session,
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 