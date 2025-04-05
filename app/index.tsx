import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, Animated, Alert, Linking, Text, ActivityIndicator } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';
import { QRScanner } from '../components/QRScanner';
import { useProtectedRoute, TabLayout } from './_layout';
import { useAuth } from '../providers/AuthProvider';

// Supabase configuratie (dezelfde als in login.tsx)
const supabaseUrl = 'https://vtyvgtgehayxexwgzerp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eXZndGdlaGF5eGV4d2d6ZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODU2NTcsImV4cCI6MjA1Nzg2MTY1N30.prrEEjOmufQJ1yrXBDIYXtIIoemFKwyYglFABxTF5tU';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default function HomeScreen() {
  // Gebruik de protected route hook om te controleren of gebruiker is ingelogd
  const { isLoading, user, isAuthenticated } = useProtectedRoute();
  
  // Als we nog aan het laden zijn, toon laadscherm
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#43976A" />
        <Text style={styles.loadingText}>Inloggegevens controleren...</Text>
      </View>
    );
  }
  
  // Als niet ingelogd, toon alleen een melding dat we omleiden
  // De _layout.tsx zorgt voor de daadwerkelijke redirect
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#43976A" />
        <Text style={styles.loadingText}>Je wordt doorgestuurd naar de login pagina...</Text>
      </View>
    );
  }
  
  // Hoofdinhoud van de home pagina
  return (
    <>
      <TabLayout />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welkom bij ChecklistApp</Text>
          <Text style={styles.headerSubtitle}>
            Hallo, {user?.email?.split('@')[0] || 'gebruiker'}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Snel aan de slag</Text>
          <Text style={styles.infoCardText}>
            Gebruik de tabs onderaan om tussen de verschillende functies te navigeren.
          </Text>
        </View>
        
        <View style={styles.menuCards}>
          <TouchableOpacity style={styles.menuCard}>
            <Ionicons name="checkbox" size={24} color="#43976A" />
            <Text style={styles.menuCardTitle}>Checklists</Text>
            <Text style={styles.menuCardText}>Bekijk en voltooi je checklists</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuCard}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#43976A" />
            <Text style={styles.menuCardTitle}>GPT-assistent</Text>
            <Text style={styles.menuCardText}>Stel vragen over procedures</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    color: '#333',
    fontSize: 16,
  },
  container: {
    flex: 1, 
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoCardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  menuCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  menuCardText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 