import React, { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View, Text, ActivityIndicator, Pressable, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Beveiligde navigatie hook
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

// Custom TabBar die we volledig zelf beheren
function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  // Definieer alleen de drie tabRoutes die we willen tonen
  const tabs = [
    { name: 'index', title: 'Home', icon: 'home' },
    { name: 'checklist', title: 'Checklist', icon: 'checkbox' },
    { name: 'gpt', title: 'GPT', icon: 'chatbubble-ellipses' }
  ];
  
  return (
    <View style={{
      flexDirection: 'row',
      height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
      paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
      backgroundColor: isDark ? '#222' : '#fff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#444' : '#eee',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === `/${tab.name}` || 
                         (tab.name === 'index' && pathname === '/');
        
        return (
          <Pressable
            key={tab.name}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 4,
            }}
            onPress={() => {
              const route = tab.name === 'index' ? '/' : `/${tab.name}`;
              router.replace(route as any);
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={24} 
              color={isActive ? '#43976A' : isDark ? '#aaa' : '#888'} 
            />
            <Text style={{ 
              fontSize: 12, 
              color: isActive ? '#43976A' : isDark ? '#aaa' : '#888',
              marginTop: 2,
            }}>
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Inner component die de auth state gebruikt
function AppNavigator() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Als we nog aan het laden zijn, toon laadscherm
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#43976A" />
        <Text style={{ marginTop: 20, color: '#333' }}>App wordt geladen...</Text>
      </View>
    );
  }
  
  // Als niet ingelogd, toon login stack zonder tabbar
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    );
  }
  
  // Bepaal of we de tabbar moeten tonen (alleen voor hoofdpagina's)
  const isMainRoute = ['/', '/index', '/checklist', '/gpt'].includes(pathname);
  
  // Krijg de huidige route (zonder slash)
  const currentRoute = pathname.startsWith('/') ? pathname.substring(1) : pathname;
  const currentScreen = currentRoute || 'index';
  
  return (
    <View style={{ flex: 1 }}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          // Schakel animaties uit voor tab navigatie
          animation: isMainRoute ? 'none' : 'default'
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ animation: 'none' }}
        />
        <Stack.Screen 
          name="checklist" 
          options={{ animation: 'none' }}
        />
        <Stack.Screen 
          name="gpt" 
          options={{ animation: 'none' }}
        />
        <Stack.Screen name="profile" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      {/* Alleen tonen als we op een hoofdroute zijn */}
      {isMainRoute && <CustomTabBar />}
    </View>
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
