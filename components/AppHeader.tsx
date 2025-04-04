import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Platform, 
  StatusBar, 
  Animated 
} from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  leftIconName?: string;
  rightIconName?: string;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  scrollY?: Animated.Value;
  transparentOnTop?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showLeftIcon = true,
  showRightIcon = true,
  leftIconName = 'qr-code',
  rightIconName = 'person-circle',
  onLeftIconPress,
  onRightIconPress,
  scrollY = new Animated.Value(0),
  transparentOnTop = false,
}) => {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [statusBarStyle, setStatusBarStyle] = useState<'light-content' | 'dark-content'>(
    'light-content'
  );
  const [currentIconColor, setCurrentIconColor] = useState<string>('#ffffff');
  
  // Bepaald de status bar padding op basis van platform
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;
  
  // Bereken de header hoogte (basis + statusbar)
  const headerBaseHeight = 60;
  const headerHeight = headerBaseHeight + statusBarHeight;
  
  // Animaties voor het scrollen
  const headerBackgroundColor = transparentOnTop 
    ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: ['transparent', isDark ? '#1a1a1a' : '#ffffff'],
        extrapolate: 'clamp',
      })
    : scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: ['#43976A', isDark ? '#1a1a1a' : '#ffffff'],
        extrapolate: 'clamp',
      });
  
  const textColor = transparentOnTop
    ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: ['#ffffff', isDark ? '#ffffff' : '#000000'],
        extrapolate: 'clamp',
      })
    : scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: ['#ffffff', isDark ? '#ffffff' : '#000000'],
        extrapolate: 'clamp',
      });
  
  const iconColor = transparentOnTop
    ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: ['#ffffff', isDark ? '#ffffff' : '#000000'],
        extrapolate: 'clamp',
      })
    : scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: ['#ffffff', isDark ? '#ffffff' : '#000000'],
        extrapolate: 'clamp',
      });
  
  const shadowOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 0.3],
    extrapolate: 'clamp',
  });

  // Update statusBarStyle en icoonkleur op basis van scroll waarde
  useEffect(() => {
    const scrollListener = scrollY.addListener(({ value }) => {
      // Update statusbar stijl
      if (transparentOnTop) {
        if (value < 25) {
          setStatusBarStyle('light-content');
          setCurrentIconColor('#ffffff'); // Wit op transparant/groen
        } else {
          setStatusBarStyle(isDark ? 'light-content' : 'dark-content');
          setCurrentIconColor(isDark ? '#ffffff' : '#000000'); // Wit in dark mode, zwart in light mode
        }
      } else {
        if (value < 50) {
          setStatusBarStyle('light-content');
          setCurrentIconColor('#ffffff'); // Wit op groen
        } else {
          setStatusBarStyle(isDark ? 'light-content' : 'dark-content');
          setCurrentIconColor(isDark ? '#ffffff' : '#000000'); // Wit in dark mode, zwart in light mode
        }
      }
    });

    return () => {
      scrollY.removeListener(scrollListener);
    };
  }, [scrollY, isDark, transparentOnTop]);

  return (
    <Animated.View 
      style={[
        styles.header, 
        { 
          height: headerHeight,
          paddingTop: statusBarHeight,
          backgroundColor: headerBackgroundColor,
          shadowOpacity: shadowOpacity,
          zIndex: 1000,
        }
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent={true}
      />
      
      <View style={styles.headerContent}>
        {/* Linker icoon */}
        {showLeftIcon ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLeftIconPress}
          >
            <Animated.View style={{ opacity: 1 }}>
              <Ionicons 
                name={leftIconName as any} 
                size={26} 
                color={currentIconColor} 
              />
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        
        {/* Titels in het midden */}
        <View style={styles.titleContainer}>
          <Animated.Text 
            style={[
              styles.title, 
              { color: textColor }
            ]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
          
          {subtitle && (
            <Animated.Text 
              style={[
                styles.subtitle, 
                { color: textColor, opacity: 0.8 }
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Animated.Text>
          )}
        </View>
        
        {/* Rechter icoon */}
        {showRightIcon ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightIconPress}
          >
            <Animated.View style={{ opacity: 1 }}>
              <Ionicons 
                name={rightIconName as any} 
                size={26} 
                color={currentIconColor} 
              />
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default AppHeader; 