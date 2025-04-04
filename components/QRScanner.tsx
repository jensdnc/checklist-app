import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface QRScannerProps {
  isVisible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function QRScanner({ isVisible, onClose, onScan }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  // Referentie om de laatst gescande code bij te houden
  const lastScanRef = useRef('');
  // Timeout referentie om scan-cooldown bij te houden
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      if (isVisible) {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();
  }, [isVisible]);

  // Reset scanner state when modal is closed
  useEffect(() => {
    if (!isVisible) {
      setIsScanning(true);
      lastScanRef.current = '';
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isVisible]);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    // Voorkom dubbele scans of scans tijdens cooldown periode
    if (!isScanning || data === lastScanRef.current) return;
    
    // Markeer deze code als laatst gescand om duplicaten te voorkomen
    lastScanRef.current = data;
    // Zet scanning tijdelijk uit
    setIsScanning(false);
    
    console.log('QR code gescand:', data);
    
    try {
      // Controleer of de gescande data een URL is
      if (data.startsWith('http')) {
        // Probeer een URL object te maken om de URL te parsen
        const url = new URL(data);
        
        // Controleer of dit een Burg Dashboard QR code URL is
        if (url.hostname === 'api.burg-dashboard.nl' && url.pathname.includes('/scan/redirect/')) {
          console.log('Volledige pathname parts:', url.pathname);
          // Verkrijg type en ID uit de URL
          const pathParts = url.pathname.split('/');
          console.log('Path parts:', pathParts);
          
          // De correcte structuur is /scan/redirect/{type}/{id}
          if (pathParts.length >= 5) {  // ["", "scan", "redirect", "hoofdobject", "123"]
            // Index 3 is type, index 4 is id
            const entityType = pathParts[3]; // hoofdobject, deelobject, etc.
            const entityId = pathParts[4];   // UUID
            
            console.log(`Geparametriseerde URL: type=${entityType}, id=${entityId}`);
            
            // Sluit de scanner
            onClose();
            
            // Meld de scan aan de parent component
            onScan(data);
            
            // Direct naar scan detail pagina navigeren zonder alert
            router.push({
              pathname: '/scan/[type]/[id]',
              params: { 
                type: entityType, 
                id: entityId 
              }
            });
            return;
          }
        }
      }
      
      // Voor niet-Burg Dashboard QRs, log alleen en sluit de scanner
      console.log('Geen Burg Dashboard QR code, gescande data:', data);
      onScan(data);
      onClose();
      
      // Reset scanner na 2 seconden om nieuwe scans mogelijk te maken
      timeoutRef.current = setTimeout(() => {
        setIsScanning(true);
        lastScanRef.current = '';
      }, 2000);
      
    } catch (error) {
      console.error('Fout bij verwerken QR code:', error);
      
      // Sluit scanner bij fouten, geen alert tonen
      onClose();
      
      // Reset scanner na 1 seconde
      timeoutRef.current = setTimeout(() => {
        setIsScanning(true);
        lastScanRef.current = '';
      }, 1000);
    }
  };

  const toggleTorch = () => {
    setIsTorchOn(prev => !prev);
  };

  if (hasPermission === null) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.instructionsText}>Camera laden...</Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    Alert.alert(
      'Camera Toegang Nodig',
      'We hebben toegang tot je camera nodig om QR-codes te kunnen scannen.',
      [{ text: 'OK', onPress: onClose }]
    );
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>

        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={isTorchOn}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417", "aztec", "code39", "code128"],
          }}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
          </View>
        </CameraView>
        
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleTorch}>
            <Ionicons 
              name={isTorchOn ? "flash" : "flash-off"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Richt je camera op een QR-code
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 0,
    borderColor: 'white',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
  },
  instructions: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  controlButton: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    marginHorizontal: 15,
  },
}); 