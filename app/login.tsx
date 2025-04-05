import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Text, Platform, SafeAreaView } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

export default function SimpleLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginFout, setLoginFout] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  // Gebruik de auth context
  const { login, user, refreshUser } = useAuth();

  // Als we al ingelogd zijn, direct doorsturen naar home
  useEffect(() => {
    if (user) {
      console.log('Gebruiker al ingelogd, doorsturen naar home...');
      router.replace('/');
    }
  }, [user]);

  useEffect(() => {
    // Debug interval om status te controleren
    const interval = setInterval(async () => {
      try {
        // Controleer of er een auth-token is
        const token = await AsyncStorage.getItem('auth-token');
        setDebugInfo(token ? 'Token aanwezig ✅' : 'Geen token ❌');
      } catch (e) {
        setDebugInfo('Fout bij controle: ' + (e as any).message);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Functie voor inloggen
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Invoer vereist', 'Vul zowel e-mail als wachtwoord in');
      return;
    }

    setLoading(true);
    setLoginFout('');

    try {
      console.log('🔑 Inloggen...');
      
      // Gebruik de login functie uit de AuthProvider
      const result = await login(email, password);
      
      if (!result.success) {
        console.error('❌ Login fout:', result.error);
        setLoginFout(result.error || 'Onbekende fout bij inloggen');
        Alert.alert('Fout bij inloggen', result.error || 'Onbekende fout bij inloggen');
      } else {
        console.log('✅ Login succesvol!');
        
        // De navigatie gebeurt automatisch via de AuthProvider
      }
    } catch (e) {
      console.error('❌ Onverwachte fout bij login:', e);
      setLoginFout('Er is een onverwachte fout opgetreden bij het inloggen.');
      Alert.alert('Login mislukt', 'Er is een onverwachte fout opgetreden bij het inloggen. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={60} color="white" />
            </View>
            <ThemedText style={styles.appTitle}>ChecklistApp</ThemedText>
            
            {/* Debug status */}
            <Text style={{marginTop: 10, color: debugInfo.includes('✅') ? 'green' : 'red'}}>
              Status: {debugInfo}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Wachtwoord"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            {loginFout ? (
              <Text style={styles.errorText}>{loginFout}</Text>
            ) : null}
          </View>
          
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Inloggen</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#43976A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    height: 50,
    backgroundColor: '#43976A',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
}); 