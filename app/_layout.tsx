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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

  useEffect(() => {
    // Controleer authenticatiestatus bij opstarten
    checkAuthenticationStatus();

    // Luister naar auth veranderingen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state gewijzigd: ${event}`, session ? 'Sessie aanwezig' : 'Geen sessie');
        
        if (session) {
          console.log('Gebruiker is ingelogd');
          setIsAuthenticated(true);
          
          // Bij inloggen, zorg ervoor dat we de gebruiker doorsturen
          if (event === 'SIGNED_IN') {
            console.log('Zojuist ingelogd, navigeren naar home');
            if (pathname === '/login') {
              router.replace('/');
            }
          }
        } else {
          console.log('Gebruiker is niet ingelogd');
          setIsAuthenticated(false);
          
          // Bij uitloggen, terug naar login scherm
          if (event === 'SIGNED_OUT') {
            console.log('Zojuist uitgelogd, navigeren naar login');
            router.replace('/login');
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
  }, [isReady]);

  // Functie om de authenticatiestatus te controleren
  const checkAuthenticationStatus = async () => {
    try {
      console.log('Controleren van gebruikerssessie...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Sessie fout:', error.message);
        setIsAuthenticated(false);
        setIsReady(true);
        
        // Als er een fout is en niet op login pagina, stuur door naar login
        if (pathname !== '/login') {
          console.log('Sessie fout, doorsturen naar login');
          router.replace('/login');
        }
        return;
      }
      
      if (data.session) {
        console.log('Geldige sessie gevonden', data.session);
        setIsAuthenticated(true);
        
        // Als de gebruiker op login pagina is maar is ingelogd, stuur direct door naar home
        if (pathname === '/login') {
          console.log('Gebruiker is ingelogd maar op loginpagina, doorsturen naar home');
          router.replace('/');
        }
      } else {
        console.log('Geen geldige sessie gevonden');
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
      setIsAuthenticated(false);
      setIsReady(true);
      // Bij een fout in auth, stuur terug naar login
      if (pathname !== '/login') {
        router.replace('/login');
      }
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
