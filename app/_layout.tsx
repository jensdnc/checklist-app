import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { usePathname, useRouter, Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

// Routebescherming component
function ProtectedRouteGuard() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Bepaal welke routes toegankelijk zijn zonder inloggen
  const isPublicRoute = pathname === '/login';
  
  // Effect om te controleren of gebruiker naar login moet worden gestuurd
  useEffect(() => {
    const checkAuth = async () => {
      // Alleen uitvoeren als de authenticatie status bekend is (niet loading)
      if (!loading) {
        // Als gebruiker niet is ingelogd EN niet op een publieke route is
        if (!user && !isPublicRoute) {
          console.log('🔒 Niet-ingelogde gebruiker probeert beveiligde route te openen:', pathname);
          console.log('🔒 Doorsturen naar login...');
          
          // Direct doorsturen naar login pagina
          router.replace('/login');
        }
      }
    };
    
    checkAuth();
  }, [user, loading, pathname, isPublicRoute]);
  
  // Toon niets tijdens het laden
  if (loading) {
    return <Slot />;
  }
  
  // Als de gebruiker niet is ingelogd en dit geen publieke route is,
  // toon alleen een leeg scherm terwijl we omgeleid worden
  if (!user && !isPublicRoute) {
    return null; // Toon niets, omdat we omgeleid worden naar login
  }
  
  // Anders, toon de normale layout
  return <RootLayoutNav />;
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

  // Toon niets tijdens het laden van de authenticatiestatus
  if (loading) {
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
