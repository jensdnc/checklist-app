import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import AppHeader from '../../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configuratie
// API URL configuratie
let API_URL = 'https://api.burg-dashboard.nl'; // Productie API URL

// Probeer de lokale configuratie te laden tijdens ontwikkeling
try {
  const localConfig = require('../../../../../../tmp/local-config');
  if (localConfig && localConfig.DEV_API_URL) {
    API_URL = localConfig.DEV_API_URL;
    console.log('Lokale ontwikkel API URL geladen:', API_URL);
  }
} catch (error) {
  // Gebruik productie URL bij fouten
}

// Supabase configuratie
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

interface HierarchicalData {
  item: any;
  deelobject: any;
  hoofdobject: any;
  project: any;
}

export default function ScanDetailScreen() {
  const { type, id } = useLocalSearchParams();
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchScanData();
  }, [type, id]);

  const fetchScanData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!type || !id) {
        throw new Error('Scan type of ID ontbreekt');
      }
      
      const entityType = String(type);
      const entityId = String(id);
      
      // Debug logging
      console.log(`Scan detail parameters: type=${entityType}, id=${entityId}`);
      
      // Gebruik de parameters direct, geen extra verwerking nodig
      const endpoint = `${API_URL}/scan/hierarchical/${entityType}/${entityId}`;
      console.log('Fetching from:', endpoint);
      
      // API aanroep
      try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          // Extra logging voor troubleshooting
          console.error(`Fout bij API aanroep: status ${response.status}`);
          const errorText = await response.text();
          console.error('Response body:', errorText);
          
          if (response.status === 404) {
            throw new Error('Item niet gevonden');
          }
          throw new Error('Er is een fout opgetreden bij het ophalen van de gegevens');
        }
        
        const result = await response.json();
        console.log('API resultaat ontvangen:', JSON.stringify(result).substring(0, 100) + '...');
        
        if (!result.data) {
          console.error('Onverwacht API resultaat:', result);
          throw new Error('Geen gegevens ontvangen van de server');
        }
        
        setHierarchicalData(result.data);
      } catch (fetchError: any) {
        console.error('Fetch error details:', fetchError);
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Error fetching scan data:', err);
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  // Render hiërarchische details
  const renderHierarchicalDetails = () => {
    if (!hierarchicalData) return null;
    
    // Bepaal welke secties moeten worden weergegeven op basis van scan type
    const sections = [];
    
    // Apparaat/Installatie sectie - ondersteun beide types
    const entityType = String(type);
    if (hierarchicalData.item && (entityType === 'apparaat' || entityType === 'installatie')) {
      sections.push(
        <View key="apparaat" style={styles.detailsCard}>
          <ThemedText style={styles.sectionTitle}>Installatie</ThemedText>
          <View style={styles.infoSection}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Naam:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.item.name}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Type:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.item.installatie_type || '-'}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Status:</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(hierarchicalData.item.status) }]}>
                <ThemedText style={styles.statusText}>{formatStatus(hierarchicalData.item.status)}</ThemedText>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToEntity('apparaat', hierarchicalData.item.id)}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Details bekijken</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // Deelobject sectie
    if (hierarchicalData.deelobject) {
      sections.push(
        <View key="deelobject" style={styles.detailsCard}>
          <ThemedText style={styles.sectionTitle}>Deelobject</ThemedText>
          <View style={styles.infoSection}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Naam:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.deelobject.name}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>DO-nummer:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.deelobject.do_number || '-'}</ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToEntity('deelobject', hierarchicalData.deelobject.id)}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Details bekijken</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // Hoofdobject sectie
    if (hierarchicalData.hoofdobject) {
      sections.push(
        <View key="hoofdobject" style={styles.detailsCard}>
          <ThemedText style={styles.sectionTitle}>Hoofdobject</ThemedText>
          <View style={styles.infoSection}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Naam:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.hoofdobject.name}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Object #:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.hoofdobject.ho_nummer || hierarchicalData.hoofdobject.ho_number || '-'}</ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToEntity('hoofdobject', hierarchicalData.hoofdobject.id)}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Details bekijken</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // Project sectie
    if (hierarchicalData.project) {
      sections.push(
        <View key="project" style={styles.detailsCard}>
          <ThemedText style={styles.sectionTitle}>Project</ThemedText>
          <View style={styles.infoSection}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Naam:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.project.name}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Adres:</ThemedText>
              <ThemedText style={styles.detailValue}>{hierarchicalData.project.address || '-'}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Status:</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(hierarchicalData.project.status) }]}>
                <ThemedText style={styles.statusText}>{formatStatus(hierarchicalData.project.status)}</ThemedText>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToEntity('project', hierarchicalData.project.id)}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Details bekijken</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return sections;
  };

  // Helper functies
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actief':
      case 'in_gebruik':
        return '#34A853'; // Groen
      case 'inactief':
      case 'buiten_gebruik':
        return '#EA4335'; // Rood
      case 'onderhoud':
        return '#FBBC05'; // Geel
      default:
        return '#9AA0A6'; // Grijs
    }
  };
  
  const formatStatus = (status: string) => {
    switch (status) {
      case 'actief': return 'Actief';
      case 'inactief': return 'Inactief';
      case 'onderhoud': return 'In onderhoud';
      case 'in_gebruik': return 'In gebruik';
      case 'buiten_gebruik': return 'Buiten gebruik';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Onbekend';
    }
  };

  const navigateToEntity = (entityType: string, entityId: string) => {
    // Hier navigeren we naar de detail pagina's in de app
    switch (entityType) {
      case 'project':
        // Veilige navigatie terug naar app scherm
        router.back();
        // Alert met informatie omdat we geen echte detailschermen hebben
        Alert.alert('Navigatie', `Navigeren naar ${entityType} met ID ${entityId}`);
        break;
      case 'hoofdobject':
        router.back();
        Alert.alert('Navigatie', `Navigeren naar ${entityType} met ID ${entityId}`);
        break;
      case 'deelobject':
        router.back();
        Alert.alert('Navigatie', `Navigeren naar ${entityType} met ID ${entityId}`);
        break;
      case 'apparaat':
        router.back();
        Alert.alert('Navigatie', `Navigeren naar ${entityType} met ID ${entityId}`);
        break;
    }
  };

  // Header opacity effect op basis van scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const getTypeTitle = (type: string): string => {
    switch (type) {
      case 'project': return 'Project';
      case 'hoofdobject': return 'Hoofdobject';
      case 'deelobject': return 'Deelobject';
      case 'apparaat': return 'Apparaat';
      case 'installatie': return 'Installatie';
      default: return 'Scan';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader 
        title={`${getTypeTitle(type as string)} Scan`}
        leftIconName="arrow-back"
        onLeftIconPress={() => router.back()}
        scrollY={scrollY}
        transparentOnTop={true}
      />
      
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.headerContainer}>
          <ThemedText style={styles.headerTitle}>
            {getTypeTitle(type as string)} Details
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Hieronder zie je alle details van het gescande item
          </ThemedText>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43A097" />
            <ThemedText style={styles.loadingText}>Gegevens worden geladen...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EA4335" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchScanData}>
              <ThemedText style={styles.retryButtonText}>Opnieuw proberen</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.hierarchyContainer}>
            {renderHierarchicalDetails()}
          </View>
        )}
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    paddingTop: 100,
    backgroundColor: '#43A097',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  hierarchyContainer: {
    padding: 16,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#43A097',
  },
  infoSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    width: '40%',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#43A097',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#43A097',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 