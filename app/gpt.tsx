import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, Keyboard, EmitterSubscription } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';

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

// API pad voor de nieuwe gestructureerde endpoints
const API_PATH = '/api/app';

// Chatbericht type
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function GPTScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hallo! Ik ben je AI-assistent. Hoe kan ik je vandaag helpen?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  
  useEffect(() => {
    // Haal de huidige gebruiker op
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUserId(data.user?.id || null);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    
    getUser();
  }, []);
  
  // Alle scroll-gerelateerde effecten in één useEffect om ze samen te houden
  useEffect(() => {
    // Hulpfunctie om te scrollen naar de bovenkant van het laatst toegevoegde bericht
    const scrollToLatestMessage = () => {
      setTimeout(() => {
        if (messages.length === 0) return;
        
        // Bereken een betere inschatting van de positie
        const avgCharsPerLine = 30; // Geschat aantal karakters per regel
        
        // Bepaal of het laatste bericht van GPT is
        const lastMessage = messages[messages.length - 1];
        const isLastFromGPT = lastMessage && !lastMessage.isUser;
        
        // Als het laatste bericht van GPT is, willen we precies naar de bovenkant scrollen
        // Anders willen we naar het einde scrollen (voor gebruikersberichten)
        if (isLastFromGPT || isLoading) {
          // Bereken de scroll positie tot net vóór het laatste bericht
          const totalLines = messages.reduce((acc, msg, index) => {
            // Als dit het laatste bericht is en van GPT, dan tellen we het niet mee
            // omdat we naar de bovenkant ervan willen scrollen
            if (index === messages.length - 1 && isLastFromGPT) {
              return acc;
            }
            
            const estimatedLines = Math.ceil(msg.text.length / avgCharsPerLine);
            // Elk bericht heeft minimaal één regel en wat extra ruimte voor padding
            return acc + Math.max(1, estimatedLines) + 2;
          }, 0);
          
          // Gemiddelde hoogte per regel (inclusief marges)
          const lineHeight = 22;
          // Voeg een kleine extra ruimte toe zodat de bovenkant van het GPT-bericht goed zichtbaar is
          const scrollPosition = totalLines * lineHeight + 10;
          
          scrollViewRef.current?.scrollTo({
            y: scrollPosition,
            animated: true,
          });
        } else {
          // Voor gebruikersberichten scrollen we gewoon naar het einde
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    };
    
    // Initiële scroll voor berichten
    if (messages.length > 0) {
      scrollToLatestMessage();
    }
    
    // Scroll als we de "Aan het typen..." indicator tonen
    if (isLoading) {
      scrollToLatestMessage();
    }
    
    // Luister naar toetsenbord events
    let keyboardDidShowListener: EmitterSubscription;
    keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollToLatestMessage();
    });
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages, isLoading]);

  // Functie voor het verzenden van een bericht naar de backend
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Voeg gebruikersbericht toe aan de UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const sentText = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Stuur bericht naar backend API
      const response = await fetch(`${API_URL}${API_PATH}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sentText,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Serverfout bij het verzenden van bericht');
      }

      const data = await response.json();
      
      // Voeg het AI-antwoord toe aan de UI
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het versturen van je bericht. Probeer het later nog eens.');
      
      // Voeg een foutbericht toe
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, er is iets misgegaan. Probeer het later nog eens.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render een individueel chatbericht
  const renderMessage = (message: ChatMessage) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        {message.isUser ? (
          <ThemedText style={[styles.messageText, { color: message.isUser ? 'white' : '#333' }]}>
            {message.text}
          </ThemedText>
        ) : (
          <Markdown 
            style={markdownStyles}
          >
            {message.text}
          </Markdown>
        )}
        <ThemedText style={[styles.timestamp, { color: message.isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#F1F1F1' }]}>
      <AppHeader 
        title="GPT Assistent" 
        scrollY={scrollY}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ThemedText>Aan het typen...</ThemedText>
            </View>
          )}
        </Animated.ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Typ een bericht..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={24}
              color={!inputText.trim() || isLoading ? '#ccc' : '#43976A'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// Markdown specifieke stijlen
const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 16,
  },
  heading1: {
    fontSize: 24,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  heading2: {
    fontSize: 20,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  heading3: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  strong: {
    fontWeight: 'bold' as const,
    color: '#333',
  },
  em: {
    fontStyle: 'italic' as const,
  },
  link: {
    color: '#43976A',
    textDecorationLine: 'underline' as const,
  },
  blockquote: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#43976A',
    marginVertical: 5,
  },
  code_block: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingTop: 30,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#43976A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 