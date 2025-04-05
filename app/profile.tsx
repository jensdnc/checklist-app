import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import AppHeader from '../components/AppHeader';

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

// Interface voor gebruikersgegevens
interface UserProfile {
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Haal gebruikersgegevens op bij het laden van het scherm
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      if (user) {
        // Basisgegevens ophalen uit de auth user
        const userMetadata = user.user_metadata;
        const email = user.email || '';
        const nameFromEmail = email.split('@')[0];
        const username = (userMetadata && userMetadata.name) ? 
                         userMetadata.name : 
                         nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        
        setUserProfile({
          email: email,
          username: username,
          created_at: new Date(user.created_at).toLocaleDateString('nl-NL'),
        });
      }
    } catch (error: any) {
      console.error('Fout bij ophalen profiel:', error.message);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het ophalen van je profiel');
    } finally {
      setLoading(false);
    }
  };

  // Complete uitlogfunctie die alle auth data opschoont
  const completeSignOut = async () => {
    try {
      setLoading(true);
      console.log('🔄 Volledige uitlog procedure gestart...');
      
      // 1. Alle Supabase auth keys uit AsyncStorage verwijderen
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.startsWith('supabase.') || 
        key.includes('auth') || 
        key === 'authSession'
      );
      
      if (authKeys.length > 0) {
        console.log('📋 Te verwijderen keys:', authKeys);
        await AsyncStorage.multiRemove(authKeys);
        console.log('✓ AsyncStorage opgeschoond');
      }
      
      // 2. Bij supabase signOut aanroepen - met nieuwe client
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Fout bij Supabase signOut:', error);
      } else {
        console.log('✓ Supabase sessie succesvol afgesloten');
      }
      
      // 3. Direct naar login navigeren
      console.log('🚪 Navigeren naar login scherm...');
      router.replace('/login');
      
      // 4. Extra reload na korte vertraging (fallback)
      setTimeout(() => {
        console.log('🔄 Veiligheidscheck: extra navigatie naar login');
        router.push('/login');
      }, 500);
      
    } catch (error) {
      console.error('❌ Fout bij volledig uitloggen:', error);
      
      // Zelfs bij fouten proberen we naar login te navigeren
      try {
        router.replace('/login');
      } catch (navError) {
        console.error('Navigatie fout:', navError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        {
          text: 'Annuleren',
          style: 'cancel'
        },
        {
          text: 'Uitloggen',
          onPress: completeSignOut,
          style: 'destructive'
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#43976A" />
        <ThemedText style={styles.loadingText}>Profiel laden...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AppHeader 
        title="Mijn Profiel"
        leftIconName="arrow-back"
        onLeftIconPress={handleBack}
        showRightIcon={false}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profielkaart met basic info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {userProfile?.username.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.username}>{userProfile?.username}</ThemedText>
          <ThemedText style={styles.email}>{userProfile?.email}</ThemedText>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <ThemedText style={styles.infoText}>
                Lid sinds: {userProfile?.created_at}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Instellingen sectie */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Instellingen</ThemedText>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuText}>Notificaties</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuText}>Privacy & Beveiliging</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="color-palette-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuText}>Weergave</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        {/* Account sectie */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuText}>Profiel bewerken</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuText}>Help & Support</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EA4335" />
            <ThemedText style={styles.logoutText}>Uitloggen</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F1F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#43976A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoContainer: {
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#EA4335',
    fontWeight: '500',
  },
}); 