import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Text, View, ActivityIndicator } from 'react-native';
import { usePathname, useRouter, Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

// Beveiligde Tab Navigatie hook, wordt gebruikt in tabscreens
export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Publieke routes die zonder inloggen toegankelijk zijn
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Debug logging
  useEffect(() => {
    console.log('🛡️ Route Guard - Pagina:', pathname);
    console.log('🛡️ Route Guard - Ingelogd:', !!user);
    console.log('🛡️ Route Guard - Laden:', loading);
    console.log('🛡️ Route Guard - Publieke route:', isPublicRoute);
  }, [pathname, user, loading, isPublicRoute]);
  
  useEffect(() => {
    // Wacht tot authenticatie geladen is
    if (!loading) {
      // Niet ingelogd en op beveiligde route? -> redirect naar login
      if (!user && !isPublicRoute) {
        console.log('🔒 Toegang geweigerd tot beveiligde route:', pathname);
        
        // Gebruik een timeout om te zorgen dat navigatie gebeurt na de render cyclus
        const timer = setTimeout(() => {
          try {
            console.log('🧭 Doorsturen naar login pagina...');
            router.replace('/login');
          } catch (e) {
            console.error('❌ Navigatie error:', e);
            
            // Fallback navigatie met extra vertraging
            setTimeout(() => {
              try {
                console.log('🔄 Proberen opnieuw te navigeren naar login...');
                router.push('/login');
              } catch (e2) {
                console.error('💥 Fallback navigatie mislukt:', e2);
              }
            }, 500);
          }
        }, 100);
        
        // Cleanup timer
        return () => clearTimeout(timer);
      }
      
      // Wel ingelogd en op login pagina? -> redirect naar home
      if (user && pathname === '/login') {
        console.log('🏠 Al ingelogd, doorsturen naar home');
        
        // Gebruik een timeout om te zorgen dat navigatie gebeurt na de render cyclus
        const timer = setTimeout(() => {
          try {
            console.log('🧭 Doorsturen naar home...');
            router.replace('/');
          } catch (e) {
            console.error('❌ Navigatie error:', e);
            
            // Fallback navigatie met extra vertraging
            setTimeout(() => {
              try {
                console.log('🔄 Proberen opnieuw te navigeren naar home...');
                router.push('/');
              } catch (e2) {
                console.error('💥 Fallback navigatie mislukt:', e2);
              }
            }, 500);
          }
        }, 100);
        
        // Cleanup timer
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, pathname, isPublicRoute]);
  
  // Geeft de loading status en user terug zodat componenten kunnen beslissen wat te tonen
  return { isLoading: loading, user, isAuthenticated: !!user };
}

// Inner component die de auth state gebruikt
function AppNavigator() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Als we nog aan het laden zijn, toon laadscherm
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#43976A" />
        <Text style={{ marginTop: 20, color: '#333' }}>App wordt geladen...</Text>
      </View>
    );
  }
  
  // Als niet ingelogd, toon login stack
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    );
  }
  
  // Anders toon de tabs (met verborgen tabs voor niet-zichtbare routes)
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#43976A',
        tabBarInactiveTintColor: isDark ? '#aaa' : '#888',
        tabBarStyle: {
          backgroundColor: isDark ? '#222' : '#fff',
          borderTopColor: isDark ? '#444' : '#eee',
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
      
      {/* Verborgen tabs - niet zichtbaar in de tab bar */}
      <Tabs.Screen
        name="(tabs)"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="+not-found"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

// Root layout component met AuthProvider
export default function RootLayout() {
  // EERST AuthProvider aanbieden, dan pas hooks gebruiken
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

// Instellingen voor expo-router
export const unstable_settings = {
  initialRouteName: 'index',
};
