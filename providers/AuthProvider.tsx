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
    let isMounted = true;
    
    const initializeAuth = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      console.log('🚀 Initialiseren authenticatiestatus...');
      
      try {
        // Toon het API endpoint voor debugging
        console.log('🌐 API endpoint:', API_BASE_URL);
        
        // Haal token op uit AsyncStorage
        const token = await getAccessToken();
        
        if (!token) {
          console.log('❌ Geen token gevonden bij opstarten');
          await clearAuthData();
          if (isMounted) setLoading(false);
          return;
        }
        
        console.log('🔑 Token gevonden, valideren...');
        
        // Voeg veiligheidsmechanisme toe om te voorkomen dat de app vastloopt
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout bij sessiecontrole')), 10000)
        );
        
        try {
          // Gebruik Promise.race om timeout te implementeren
          await Promise.race([
            (async () => {
              // Controleer token geldigheid via backend
              try {
                const response = await fetch(`${API_BASE_URL}/auth/session`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log('📥 Sessie check status:', response.status);
                
                if (!response.ok) {
                  console.error('❌ Sessie fout:', response.status);
                  await clearAuthData();
                  return;
                }
                
                const data = await response.json();
                console.log('📦 Sessie data ontvangen:', JSON.stringify(data, null, 2));
                
                if (!isMounted) return;
                
                // We accepteren ook alleen een token als geldig, zelfs als sessie/user ontbreken
                if (token) {
                  console.log('✅ Token is geldig');
                  
                  // Sla sessie op als die bestaat
                  if (data.session) {
                    console.log('📝 Sessie opgeslagen');
                    setSession(data.session);
                  }
                  
                  // Sla gebruiker op als die bestaat
                  if (data.user) {
                    console.log('👤 Gebruiker geladen:', data.user.email);
                    setUser(data.user);
                    
                    // Controleer admin rol
                    const isUserAdmin = data.user.app_metadata?.role === 'admin';
                    setIsAdmin(isUserAdmin);
                  } else {
                    // Als we alleen een token hebben maar geen gebruiker, maken we een basis gebruiker
                    console.log('⚠️ Geen gebruikersdata maar wel geldig token, maak basis gebruiker');
                    setUser({
                      id: 'token-based-user',
                      app_metadata: {},
                      user_metadata: {}
                    } as any);
                  }
                } else {
                  console.log('❌ Geen geldige sessie gevonden');
                  await clearAuthData();
                }
              } catch (fetchError) {
                throw fetchError; // Gooi door naar de catch buiten Promise.race
              }
            })(),
            timeoutPromise
          ]);
        } catch (raceError: any) {
          console.error('❌ Fout bij sessiecontrole:', raceError.message);
          console.log('⚠️ Sessiecontrole mislukt - ga door zonder sessie');
          await clearAuthData();
          
          // Probeer na een tijdje opnieuw te verbinden
          if (isMounted) {
            setTimeout(() => {
              refreshUser();
            }, 5000);
          }
        }
      } catch (error) {
        console.error('❌ Onverwachte fout bij initialisatie:', error);
        await clearAuthData();
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Cleanup functie om memory leaks te voorkomen
    return () => {
      isMounted = false;
    };
  }, []);

  // Login functie via backend API
  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 Inlogpoging gestart voor:', email);
      
      // Maak schoon voordat we inloggen
      await clearAuthData();
      
      console.log('📡 Verbinden met backend API:', API_BASE_URL);
      
      // Login via backend API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('📥 Backend response status:', response.status);
      
      if (!response.ok) {
        let errorMsg = 'Inloggen mislukt. Probeer het opnieuw.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          console.error('❌ Server foutmelding:', errorMsg);
        } catch (e) {
          console.error('❌ Kon response niet parsen:', e);
        }
        
        return { success: false, error: errorMsg };
      }
      
      // Probeer de server response te parsen
      let data;
      try {
        data = await response.json();
        console.log('📦 Data ontvangen:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('❌ Fout bij parsen van server response:', e);
        return { 
          success: false, 
          error: 'Kon serverrespons niet verwerken. Probeer het later opnieuw.'
        };
      }
      
      // Debug log
      console.log('🔍 Controle response data:');
      console.log('  - Token aanwezig (top-level):', !!data.token);
      console.log('  - Session.access_token aanwezig:', !!(data.session?.access_token));
      console.log('  - Sessie aanwezig:', !!data.session);
      console.log('  - Gebruiker aanwezig:', !!data.user);
      
      // Haal token uit het juiste veld (ofwel direct op data of in session.access_token)
      const authToken = data.token || (data.session?.access_token);
      
      // Controleer of we de minimale vereiste gegevens hebben
      if (authToken) {
        console.log('✅ Token gevonden, gebruiker wordt ingelogd');
        
        // Bewaar het token voor gebruik in volgende requests
        await AsyncStorage.setItem('auth-token', authToken);
        
        // Als we minimaal een user of session hebben, kunnen we inloggen
        if (data.user) {
          setUser(data.user);
          
          // Controleer admin rol als metadata beschikbaar is
          const isUserAdmin = data.user.app_metadata?.role === 'admin' || 
                            data.user.user_metadata?.role === 'admin';
          setIsAdmin(isUserAdmin);
          console.log('👑 Admin rechten:', isUserAdmin ? 'JA' : 'NEE');
        } else {
          // Als we geen gebruiker hebben maar wel een token, kunnen we nog steeds doorgaan
          console.warn('⚠️ Geen gebruikersdata ontvangen, maar wel token');
          
          // Maak een basis gebruiker aan op basis van wat we weten
          setUser({
            id: 'unknown',
            email: email,
            app_metadata: {},
            user_metadata: {},
          } as any);
        }
        
        // Sessie is niet strikt noodzakelijk, maar wel handig
        if (data.session) {
          setSession(data.session);
        } else {
          console.warn('⚠️ Geen sessie ontvangen van server');
        }
        
        return { success: true };
      } else {
        console.error('❌ Geen token gevonden in de respons');
        return { 
          success: false, 
          error: 'Geen toegangstoken ontvangen. Probeer opnieuw in te loggen.'
        };
      }
    } catch (error: any) {
      // Verbindingsfout of andere onverwachte fout
      console.error('❌ Onverwachte fout bij inloggen:', error);
      
      // Onderscheid tussen netwerkfouten en andere fouten
      const isNetworkError = error.message?.includes('Network') || 
                            error.message?.includes('network') ||
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        return { 
          success: false, 
          error: 'Geen verbinding met de server. Controleer je internetverbinding.' 
        };
      }
      
      return { 
        success: false, 
        error: 'Er is een onverwachte fout opgetreden bij het inloggen.' 
      };
    }
  };

  // Logout functie via backend en lokaal
  const logout = async () => {
    try {
      console.log('🚪 Uitloggen gestart...');
      
      // Haal token op voor uitlogverzoek
      const token = await getAccessToken();
      
      // Als we een token hebben, probeer netjes uit te loggen bij de backend
      if (token) {
        try {
          console.log('📡 Uitloggen bij backend...');
          
          const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('👍 Succesvol uitgelogd bij backend');
          } else {
            console.warn('⚠️ Kon niet uitloggen bij backend:', response.status);
          }
        } catch (error) {
          // Als het uitloggen mislukt, gaan we toch door met lokaal uitloggen
          console.error('⚠️ Fout bij uitloggen bij backend:', error);
        }
      }
      
      // Altijd lokaal uitloggen, ongeacht of backend uitloggen is gelukt
      console.log('🧹 Lokaal alle auth data verwijderen...');
      await clearAuthData();
      
      console.log('✅ Volledig uitgelogd!');
    } catch (error) {
      console.error('❌ Fout bij uitloggen:', error);
      
      // Nog een laatste poging om auth data te wissen
      try {
        await clearAuthData();
      } catch (e) {
        console.error('💥 Kritieke fout bij opschonen auth data:', e);
      }
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