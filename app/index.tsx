import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, Animated, Alert, Linking, Text, ActivityIndicator } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { router } from 'expo-router';
import AppHeader from '../components/AppHeader';
import { QRScanner } from '../components/QRScanner';
import { useProtectedRoute } from './_layout';
import { useAuth } from '../providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  // Gebruik de protected route hook om te controleren of gebruiker is ingelogd
  const { isLoading, user, isAuthenticated } = useProtectedRoute();
  const [username, setUsername] = useState<string>('Gebruiker');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // BELANGRIJK: Alle hooks MOETEN hier gedefinieerd worden voordat er een return is
  
  // Stel de gebruikersnaam in op basis van e-mail
  useEffect(() => {
    if (user?.email) {
      // Gebruik de naam uit het e-mailadres (alles voor de @)
      const email = user.email || '';
      const nameFromEmail = email.split('@')[0];
      // Maak eerste letter hoofdletter
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      setUsername(formattedName);
    }
  }, [user]);

  // QR scanner handlers
  const handleQRPress = () => {
    setShowQRScanner(true);
  };

  const handleQRScan = (data: string) => {
    try {
      console.log('QR code gescand, data:', data);
      
      // Controleer of de gescande data een URL is
      if (data.startsWith('http')) {
        const url = new URL(data);
        console.log('URL parsed:', url.hostname, url.pathname);
        
        // Ondersteun beide domeinen
        if (url.hostname === 'app.burg-dashboard.nl' || url.hostname === 'api.burg-dashboard.nl' || url.hostname === 'burg-dashboard.nl') {
          // Ondersteun zowel oude '/scan/redirect/[type]/[id]' als nieuwe '/scan/[type]/[id]' formaten
          let pathParts = url.pathname.split('/').filter(part => part.length > 0);
          console.log('Path parts:', pathParts);
          
          // Controleer of dit een scan URL is
          if (pathParts[0] === 'scan') {
            let type, id;
            
            if (pathParts[1] === 'redirect' && pathParts.length >= 4) {
              // Oud formaat: /scan/redirect/[type]/[id]
              type = pathParts[2];
              id = pathParts[3];
            } else if (pathParts.length >= 3) {
              // Nieuw formaat: /scan/[type]/[id]
              type = pathParts[1];
              id = pathParts[2];
            }
            
            if (type && id) {
              console.log(`Navigeren naar scan/${type}/${id}`);
              
              // Belangrijk: gebruik setTimeout om te zorgen dat router.push pas wordt uitgevoerd
              // nadat de QR scanner is gesloten (voorkomt navigatieproblemen)
              setTimeout(() => {
                router.push({
                  pathname: '/scan/[type]/[id]',
                  params: { type, id }
                });
              }, 300);
              
              return;
            }
          }
        }
        
        // Fallback: open de URL in een browser als het geen specifiek scan format is
        Alert.alert(
          'Externe link',
          'De gescande QR code leidt naar een externe website. Wil je deze openen?',
          [
            { 
              text: 'Annuleren', 
              style: 'cancel' 
            },
            { 
              text: 'Openen', 
              onPress: () => Linking.openURL(data)
            }
          ]
        );
      } else {
        // Als het geen URL is, toon de raw data
        Alert.alert(
          'QR Code Inhoud',
          `De volgende QR code is gescand: ${data}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Fout bij verwerken QR code:', error);
      // Bij fouten, toon een algemene melding
      Alert.alert(
        'Fout bij QR code',
        `Er is een fout opgetreden bij het verwerken van de QR code: ${error}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };
  
  // NU pas, na alle hooks, kunnen we conditionele returns doen
  
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
    <ThemedView style={styles.container}>
      <AppHeader 
        title="ChecklistApp" 
        subtitle="Welkom terug"
        leftIconName="qr-code"
        rightIconName="person-circle"
        onLeftIconPress={handleQRPress}
        onRightIconPress={handleProfilePress}
        scrollY={scrollY}
        transparentOnTop={false}
      />
      
      <QRScanner
        isVisible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeCard}>
            <ThemedText style={styles.welcome}>Welkom, {username}!</ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              Wat wil je vandaag doen?
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.widgetsContainer}>
          <TouchableOpacity 
            style={styles.widget}
            onPress={() => router.push('/checklist')}
          >
            <View style={styles.widgetIcon}>
              <Ionicons name="checkbox" size={24} color="#43976A" />
            </View>
            <ThemedText style={styles.widgetTitle}>Checklist</ThemedText>
            <ThemedText style={styles.widgetSubtitle}>Beheer je taken</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.widget}
            onPress={() => router.push('/gpt')}
          >
            <View style={styles.widgetIcon}>
              <Ionicons name="chatbubbles" size={24} color="#4285F4" />
            </View>
            <ThemedText style={styles.widgetTitle}>GPT Assistent</ThemedText>
            <ThemedText style={styles.widgetSubtitle}>Vraag hulp</ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Statistieken</ThemedText>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>12</ThemedText>
              <ThemedText style={styles.statLabel}>Taken Voltooid</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>5</ThemedText>
              <ThemedText style={styles.statLabel}>Openstaand</ThemedText>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </ThemedView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 30,
    zIndex: 10,
  },
  welcomeCard: {
    backgroundColor: '#43976A',
    borderRadius: 16,
    padding: 20,
    paddingTop: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  widgetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  widget: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  widgetSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  statsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 10,
  },
}); 