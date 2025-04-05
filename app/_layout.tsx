import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter, Slot } from 'expo-router';

// Supabase configuratie (dezelfde als in andere bestanden)
const supabaseUrl = 'https://vtyvgtgehayxexwgzerp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eXZndGdlaGF5eGV4d2d6ZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODU2NTcsImV4cCI6MjA1Nzg2MTY1N30.prrEEjOmufQJ1yrXBDIYXtIIoemFKwyYglFABxTF5tU';

// Functie om een nieuwe Supabase client te maken
const createSupabaseClient = () => {
  // Voor elk gebruik een verse client
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

// Gebruik een functie die altijd een nieuwe client geeft
// Verminder zo problemen met oude/corrupte state
const getSupabase = () => {
  return createSupabaseClient();
};

export default function AppLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  const router = useRouter();

  // Controleer of we op het loginscherm of profielscherm zijn
  const isLoginScreen = pathname === '/login';
  const isProfileScreen = pathname === '/profile';
  
  // Hard reset functie
  const hardResetAuthState = async () => {
    try {
      console.log('⚠️ HARD RESET van auth state...');
      
      // Alle AsyncStorage keys ophalen
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Alle auth/supabase keys vinden
      const authKeys = allKeys.filter(key => 
        key.startsWith('supabase.') || 
        key.includes('auth') || 
        key === 'authSession'
      );
      
      // Als er auth keys zijn, verwijder ze
      if (authKeys.length > 0) {
        console.log('Verwijderen van keys:', authKeys);
        await AsyncStorage.multiRemove(authKeys);
      }
      
      // Sessie sluiten bij supabase
      const supabase = getSupabase();
      await supabase.auth.signOut();
      
      console.log('Auth state reset voltooid. App state wordt gerest.');
      
      // Reset app state
      setIsAuthenticated(false);
      setIsReady(false);
      
      // Na kleine vertraging opnieuw controleren
      setTimeout(() => {
        setIsReady(true);
        router.replace('/login');
      }, 500);
      
    } catch (error) {
      console.error('Fout bij hard reset:', error);
      
      // Zelfs bij fouten sturen we de gebruiker naar login
      setIsAuthenticated(false);
      router.replace('/login');
    }
  };

  useEffect(() => {
    // Controleer authenticatiestatus bij opstarten
    checkAuthenticationStatus();

    // Luister naar auth veranderingen
    const supabase = getSupabase();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state gewijzigd: ${event}`, session ? 'Sessie aanwezig' : 'Geen sessie');
        
        if (session) {
          console.log('Gebruiker is ingelogd, event:', event);
          setIsAuthenticated(true);
          
          // Bij inloggen, zorg ervoor dat we de gebruiker doorsturen
          if (event === 'SIGNED_IN') {
            console.log('Zojuist ingelogd, navigeren naar home');
            if (pathname === '/login') {
              router.replace('/');
            }
          }
        } else {
          console.log('Gebruiker is niet ingelogd, event:', event);
          setIsAuthenticated(false);
          
          // Bij uitloggen, terug naar login scherm
          if (event === 'SIGNED_OUT') {
            console.log('Zojuist uitgelogd, navigeren naar login');
            // Hard reset bij uitloggen
            hardResetAuthState();
          }
        }
      }
    );

    return () => {
      // Schoon listener op bij unmount
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [isReady, pathname]);

  // Extra helper functie om AsyncStorage te debuggen
  const debugAuthStorage = async () => {
    try {
      console.log('===== DEBUG AUTH STORAGE =====');
      const keys = await AsyncStorage.getAllKeys();
      console.log('Alle AsyncStorage keys:', keys);
      
      // Zoek Supabase gerelateerde keys
      const supabaseKeys = keys.filter(key => 
        key.startsWith('supabase.') || 
        key.includes('auth') || 
        key === 'authSession'
      );
      
      console.log('Supabase keys:', supabaseKeys);
      
      // Log de inhoud van de Supabase keys
      for (const key of supabaseKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null'}`);
      }
      console.log('===== EINDE DEBUG =====');
    } catch (error) {
      console.error('Debug storage error:', error);
    }
  };

  // Functie om de authenticatiestatus te controleren
  const checkAuthenticationStatus = async () => {
    try {
      // Debug AsyncStorage om auth problemen te helpen oplossen
      await debugAuthStorage();
      
      console.log('Controleren van gebruikerssessie...');
      
      // Gebruik een verse supabase instantie
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('⚠️ Sessie fout:', error.message);
        
        // Bij sessie fouten, probeer een hard reset
        await hardResetAuthState();
        return;
      }
      
      if (data.session) {
        console.log('✓ Geldige sessie gevonden', data.session);
        setIsAuthenticated(true);
        
        // Als de gebruiker op login pagina is maar is ingelogd, stuur direct door naar home
        if (pathname === '/login') {
          console.log('Gebruiker is ingelogd maar op loginpagina, doorsturen naar home');
          router.replace('/');
        }
      } else {
        console.log('✗ Geen geldige sessie gevonden');
        setIsAuthenticated(false);
        
        // Als gebruiker niet is ingelogd en niet op login pagina is, stuur door naar login
        if (pathname !== '/login' && pathname !== undefined) {
          console.log('Gebruiker niet ingelogd, doorsturen naar login');
          router.replace('/login');
        }
      }
      
      // Markeer de component als ready nadat we de authenticatie hebben gecontroleerd
      setIsReady(true);
    } catch (error: any) {
      console.error('Auth error details:', error);
      
      // Bij een fout, hard reset uitvoeren
      await hardResetAuthState();
    }
  };

  // Toon niets tijdens het laden van de authenticatiestatus
  if (isAuthenticated === null) {
    return <Slot />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#43976A', // Aangepast naar groen
        tabBarInactiveTintColor: isDark ? '#aaa' : '#888',
        tabBarStyle: {
          backgroundColor: isDark ? '#222' : '#fff',
          borderTopColor: isDark ? '#444' : '#eee',
          // Verberg de tabbar op het loginscherm en profielscherm
          display: (isLoginScreen || isProfileScreen) ? 'none' : 'flex',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
        redirect={!isAuthenticated}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" color={color} size={size} />
          ),
        }}
        redirect={!isAuthenticated}
      />
      <Tabs.Screen
        name="gpt"
        options={{
          title: 'GPT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" color={color} size={size} />
          ),
        }}
        redirect={!isAuthenticated}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: !isAuthenticated ? '/login' : null,
          title: 'Login',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Verberg deze uit de tabs navigatie
          title: 'Profiel',
        }}
        redirect={!isAuthenticated}
      />
    </Tabs>
  );
}
