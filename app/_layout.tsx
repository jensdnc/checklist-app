import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Text, View, ActivityIndicator } from 'react-native';
import { usePathname, useRouter, Stack, Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

// Publieke routes die zonder inloggen toegankelijk zijn
const publicRoutes = ['/login'];

// Hoofdcomponent met AuthProvider
export default function AppLayout() {
  return (
    <AuthProvider>
      <RootLayoutComponent />
    </AuthProvider>
  );
}

// Root component met conditionele navigatie
function RootLayoutComponent() {
  // Begin altijd met een Slot renderen om de fout te voorkomen
  return <Slot />;
}

// Beveiligde Tab Navigatie, wordt alleen gebruikt in index.tsx, etc.
export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Publieke routes die zonder inloggen toegankelijk zijn
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  useEffect(() => {
    // Wacht tot authenticatie geladen is
    if (!loading) {
      // Niet ingelogd en op beveiligde route? -> redirect naar login
      if (!user && !isPublicRoute) {
        console.log('🔒 Toegang geweigerd tot beveiligde route:', pathname);
        
        // Gebruik een timeout om te zorgen dat navigatie gebeurt na de render cyclus
        setTimeout(() => {
          router.replace('/login');
        }, 50);
      }
      
      // Wel ingelogd en op login pagina? -> redirect naar home
      if (user && pathname === '/login') {
        console.log('🏠 Al ingelogd, doorsturen naar home');
        
        // Gebruik een timeout om te zorgen dat navigatie gebeurt na de render cyclus
        setTimeout(() => {
          router.replace('/');
        }, 50);
      }
    }
  }, [user, loading, pathname, isPublicRoute]);
  
  // Geeft de loading status en user terug zodat componenten kunnen beslissen wat te tonen
  return { isLoading: loading, user, isAuthenticated: !!user };
}

// Tab navigatie component - wordt gebruikt in de individuele pagina's
export function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  
  // Controleer of we op het profielscherm zijn
  const isProfileScreen = pathname === '/profile';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#43976A', // Aangepast naar groen
        tabBarInactiveTintColor: isDark ? '#aaa' : '#888',
        tabBarStyle: {
          backgroundColor: isDark ? '#222' : '#fff',
          borderTopColor: isDark ? '#444' : '#eee',
          // Verberg de tabbar op het profielscherm
          display: isProfileScreen ? 'none' : 'flex',
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
        name="profile"
        options={{
          title: 'Profiel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
