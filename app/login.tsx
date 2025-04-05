import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const supabaseUrl = 'https://vtyvgtgehayxexwgzerp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eXZndGdlaGF5eGV4d2d6ZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODU2NTcsImV4cCI6MjA1Nzg2MTY1N30.prrEEjOmufQJ1yrXBDIYXtIIoemFKwyYglFABxTF5tU';

const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

const getSupabase = () => {
  return createSupabaseClient();
};

export default function SimpleLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cleanupOldAuth();
  }, []);

  const cleanupOldAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log('Bestaande sessie opschonen voor nieuwe login...');
        await supabase.auth.signOut();
        
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => 
          key.startsWith('supabase.') || 
          key.includes('auth') || 
          key === 'authSession'
        );
        
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
        }
      }
    } catch (error) {
      console.error('Fout bij opschonen oude sessie:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Invoer vereist', 'Vul zowel e-mail als wachtwoord in');
      return;
    }

    try {
      setLoading(true);
      
      await cleanupOldAuth();
      
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        Alert.alert('Fout bij inloggen', error.message);
        return;
      }

      if (data && data.session) {
        console.log('Login succesvol, sessie ID:', data.session.access_token.substring(0, 10) + '...');
        
        try {
          router.replace('/');
        } catch (navError) {
          console.error('Navigatie fout:', navError);
          setTimeout(() => {
            router.push('/');
          }, 300);
        }
      } else {
        Alert.alert('Login fout', 'Kon geen sessie aanmaken. Probeer opnieuw.');
      }
    } catch (error: any) {
      console.error('Onverwachte login error:', error);
      Alert.alert('Login mislukt', 
        'Er is een onverwachte fout opgetreden bij het inloggen. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="white" />
          </View>
          <ThemedText style={styles.appTitle}>ChecklistApp</ThemedText>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mailadres"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Wachtwoord"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Inloggen</ThemedText>
            )}
          </TouchableOpacity>
        </View>
        
        <ThemedText style={styles.hint}>
          Gebruik de inloggegevens die je hebt ontvangen.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#43976A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#43976A',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
  },
}); 