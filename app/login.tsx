import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Text, Platform, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginFout, setLoginFout] = useState('');
  const [debugInfo, setDebugInfo] = useState('Controleert status...');
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Gebruik de auth context
  const { login, user } = useAuth();

  // Effect om te navigeren na succesvolle login
  useEffect(() => {
    if (loginSuccess) {
      console.log('🏠 Login succesvol, naar home navigeren...');
      
      // Kleine timeout om de auth state te laten updaten
      setTimeout(() => {
        try {
          console.log('🧭 Navigeren naar index...');
          router.replace('/');
        } catch (e) {
          console.error('❌ Navigatie error:', e);
          
          // Fallback navigatie met extra vertraging
          setTimeout(() => {
            try {
              console.log('🔄 Proberen opnieuw te navigeren...');
              router.push('/');
            } catch (e2) {
              console.error('💥 Fallback navigatie mislukt:', e2);
            }
          }, 500);
        }
      }, 300);
    }
  }, [loginSuccess]);

  // Debug info bijwerken
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('auth-token');
        setDebugInfo(token ? 'Token aanwezig ✅' : 'Geen token ❌');
      } catch (e) {
        setDebugInfo('Fout bij controleren token');
      }
    };
    
    // Controleer direct bij laden
    checkToken();
    
    // En daarna elke 3 seconden
    const interval = setInterval(checkToken, 3000);
    return () => clearInterval(interval);
  }, []);

  // Functie voor inloggen
  const handleLogin = async () => {
    // Valideer email en wachtwoord
    if (!email.trim()) {
      setLoginFout('Vul je e-mailadres in');
      return;
    }
    
    if (!password) {
      setLoginFout('Vul je wachtwoord in');
      return;
    }
    
    // Email formaat controleren
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setLoginFout('Ongeldig e-mailadres');
      return;
    }

    // Reset fouten en start laden
    setLoginFout('');
    setLoading(true);
    setLoginSuccess(false);

    try {
      console.log('🔑 Inlogpoging gestart voor:', email);
      
      // Gebruik de login functie uit de AuthProvider
      const result = await login(email, password);
      
      if (!result.success) {
        console.error('❌ Login mislukt:', result.error);
        
        // Toon gebruiksvriendelijke foutmelding
        let friendlyError = 'Inloggen mislukt. Controleer je gegevens en probeer opnieuw.';
        
        if (result.error?.includes('credentials')) {
          friendlyError = 'E-mailadres of wachtwoord is onjuist.';
        } else if (result.error?.includes('network')) {
          friendlyError = 'Geen verbinding met de server. Controleer je internetverbinding.';
        } else if (result.error?.includes('too many')) {
          friendlyError = 'Te veel inlogpogingen. Probeer later opnieuw.';
        }
        
        setLoginFout(friendlyError);
      } else {
        console.log('✅ Login succesvol, token opgeslagen!');
        // Zet loginSuccess op true om navigatie te triggeren
        setLoginSuccess(true);
      }
    } catch (e) {
      console.error('❌ Onverwachte fout:', e);
      setLoginFout('Er is een onverwachte fout opgetreden. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  // Render login formulier
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={60} color="white" />
            </View>
            <ThemedText style={styles.appTitle}>ChecklistApp</ThemedText>
            
            {/* Debug informatie (altijd zichtbaar voor nu) */}
            <Text style={{
              marginTop: 10, 
              fontSize: 12,
              color: debugInfo.includes('✅') ? '#43976A' : '#999'
            }}>
              {debugInfo}
            </Text>
            
            {/* Login success indicator */}
            {loginSuccess && (
              <Text style={{
                marginTop: 5,
                fontSize: 12,
                color: '#43976A'
              }}>
                Ingelogd! Doorsturen...
              </Text>
            )}
          </View>
          
          <View style={styles.formContainer}>
            {/* Foutmelding */}
            {loginFout ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                <Text style={styles.errorText}>{loginFout}</Text>
              </View>
            ) : null}
            
            {/* E-mail input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mailadres"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => {/* Focus wachtwoord */}}
              />
            </View>
            
            {/* Wachtwoord input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Wachtwoord"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>
          
          {/* Login knop */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading || loginSuccess}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : loginSuccess ? (
              <Text style={styles.loginButtonText}>✓ Ingelogd</Text>
            ) : (
              <Text style={styles.loginButtonText}>Inloggen</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    marginBottom: 30,
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
  formContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingRight: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
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
}); 