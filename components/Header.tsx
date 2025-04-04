import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { useColorScheme } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  showQRCode?: boolean;
  showProfilePic?: boolean;
  qrValue?: string;
  profilePicUri?: string;
  onQRPress?: () => void;
  onProfilePress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showQRCode = false,
  showProfilePic = false,
  qrValue = 'https://checklistapp.com',
  profilePicUri = 'https://i.pravatar.cc/150',
  onQRPress,
  onProfilePress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[
      styles.header, 
      { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 10 }
    ]}>
      <View style={styles.leftContainer}>
        {showQRCode && (
          <TouchableOpacity onPress={onQRPress} style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={40}
              backgroundColor={isDark ? '#000' : '#fff'}
              color={isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <ThemedText style={styles.title}>{title}</ThemedText>
      
      <View style={styles.rightContainer}>
        {showProfilePic && (
          <TouchableOpacity onPress={onProfilePress}>
            <Image
              source={{ uri: profilePicUri }}
              style={styles.profilePic}
            />
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    width: '100%',
    paddingBottom: 10,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrContainer: {
    padding: 5,
    borderRadius: 8,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default Header; 