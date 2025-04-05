import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Text, View, ActivityIndicator } from 'react-native';
import { usePathname, useRouter, Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

// Routebescherming component
function ProtectedRouteGuard() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  
  console.log('🛡️ Route Guard - Huidige pagina:', pathname);
  console.log('🛡️ Route Guard - Ingelogd:', !!user);
  console.log('🛡️ Route Guard - Laden:', loading);
  
  // Bepaal welke routes toegankelijk zijn zonder inloggen
  const isPublicRoute = pathname === '/login';
  
  // Effect om te controleren of gebruiker naar login moet worden gestuurd
  useEffect(() => {
    const checkAuth = async () => {
      // Voorkom dubbele redirects
      if (redirecting) return;
      
      // Alleen uitvoeren als de authenticatie status bekend is (niet loading)
      if (!loading) {
        // Als gebruiker niet is ingelogd EN niet op een publieke route is
        if (!user && !isPublicRoute) {
          console.log('🔒 Niet-ingelogde gebruiker probeert beveiligde route te openen:', pathname);
          console.log('🔒 Doorsturen naar login...');
          
          setRedirecting(true);
          
          try {
            // Direct doorsturen naar login pagina
            await router.replace('/login');
          } catch (e) {
            console.error('⚠️ Navigatiefout bij doorsturen naar login:', e);
            // Fallback navigatie in geval van fouten
            setTimeout(() => {
              router.push('/login');
            }, 100);
          }
          
          // Reset redirecting na een korte delay
          setTimeout(() => {
            setRedirecting(false);
          }, 500);
        }
      }
    };
    
    checkAuth();
  }, [user, loading, pathname, isPublicRoute, redirecting]);
  
  // Als we nog bezig zijn met laden, toon een laadscherm
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#43976A" />
        <Text style={{ marginTop: 20, color: '#333' }}>App wordt geladen...</Text>
      </View>
    );
  }
  
  // Als gebruiker op login pagina is en niet ingelogd, of gebruiker is ingelogd, render normaal
  if ((isPublicRoute && !user) || user) {
    return <RootLayoutNav />;
  }
  
  // In alle andere gevallen, toon een eenvoudig laadscherm terwijl we doorsturen naar login
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#43976A" />
      <Text style={{ marginTop: 20, color: '#333' }}>Doorsturen naar login...</Text>
    </View>
  );
}

// Layout wrapper component met tabs
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Bepaal of gebruiker is ingelogd
  const isAuthenticated = !!user;

  // Controleer of we op het loginscherm of profielscherm zijn
  const isLoginScreen = pathname === '/login';
  const isProfileScreen = pathname === '/profile';

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
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="gpt"
        options={{
          title: 'GPT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" color={color} size={size} />
          ),
        }}
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
      />
    </Tabs>
  );
}

// Hoofdcomponent met AuthProvider
export default function AppLayout() {
  return (
    <AuthProvider>
      <ProtectedRouteGuard />
    </AuthProvider>
  );
}
