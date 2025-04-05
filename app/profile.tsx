import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthProvider';

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Gebruik de auth context
  const { user, logout, isAdmin } = useAuth();

  // Functie om uit te loggen
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      console.log('🚪 Uitloggen gestart...');
      
      // Gebruik de logout functie uit de AuthProvider
      await logout();
      
      // De navigatie gebeurt automatisch in de AuthProvider
    } catch (error) {
      console.error('❌ Fout bij uitloggen:', error);
      Alert.alert('Uitloggen mislukt', 'Er is een probleem opgetreden bij het uitloggen. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debug-functie om authenticatie-gerelateerde opslag te bekijken
  const showAuthDebug = async () => {
    try {
      console.log('===== DEBUG AUTH KEYS =====');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('Alle keys:', allKeys);
      
      const authKeys = allKeys.filter(key => 
        key.startsWith('supabase.') || 
        key.includes('auth') || 
        key.includes('token') ||
        key === 'authSession'
      );
      
      console.log('Auth-gerelateerde keys:', authKeys);
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null'}`);
      }
      
      Alert.alert('Auth Debug', `${authKeys.length} auth keys gevonden. Bekijk de console voor details.`);
    } catch (error) {
      console.error('Debug fout:', error);
      Alert.alert('Debug Fout', 'Kan auth informatie niet ophalen.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color="#fff" />
            </View>
          </View>
          
          <ThemedText style={styles.name}>{user?.email || 'Gebruiker'}</ThemedText>
          <ThemedText style={styles.role}>{isAdmin ? 'Administrator' : 'Gebruiker'}</ThemedText>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
            <Ionicons name="home-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuItemText}>Home</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={showAuthDebug}>
            <Ionicons name="bug-outline" size={24} color="#43976A" />
            <ThemedText style={styles.menuItemText}>Bekijk Auth Debug</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} disabled={isLoading}>
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
            {isLoading ? (
              <ActivityIndicator size="small" color="#e74c3c" style={{marginLeft: 10}} />
            ) : (
              <ThemedText style={[styles.menuItemText, styles.logoutText]}>Uitloggen</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#43976A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  logoutText: {
    color: '#e74c3c',
  },
}); 