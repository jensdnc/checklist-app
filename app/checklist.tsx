import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Animated } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Taak type
interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: Date;
}

export default function ChecklistScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haal de huidige gebruiker op
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (data.user) {
          setUserId(data.user.id);
          // Haal taken op zodra de gebruiker is geladen
          fetchTasks(data.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setLoading(false);
      }
    };
    
    getUser();
  }, []);

  // Taken ophalen van de backend
  const fetchTasks = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${API_PATH}/tasks/${id}`);
      
      if (!response.ok) {
        throw new Error('Fout bij het ophalen van taken');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het ophalen van je taken');
    } finally {
      setLoading(false);
    }
  };

  // Taak toevoegen via de backend
  const addTask = async () => {
    if (!newTaskTitle.trim() || !userId) {
      Alert.alert('Fout', 'Taaknaam mag niet leeg zijn');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${API_PATH}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          userId: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Fout bij het toevoegen van taak');
      }
      
      const newTask = await response.json();
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het toevoegen van je taak');
    } finally {
      setLoading(false);
    }
  };

  // Taak status wisselen via de backend
  const toggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}${API_PATH}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !currentStatus,
          userId: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Fout bij het bijwerken van taak');
      }
      
      const updatedTask = await response.json();
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het bijwerken van je taak');
    }
  };

  // Taak verwijderen via de backend
  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Taak verwijderen',
      'Weet je zeker dat je deze taak wilt verwijderen?',
      [
        {
          text: 'Annuleren',
          style: 'cancel',
        },
        {
          text: 'Verwijderen',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}${API_PATH}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userId,
                }),
              });
              
              if (!response.ok) {
                throw new Error('Fout bij het verwijderen van taak');
              }
              
              setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Fout', 'Er is een fout opgetreden bij het verwijderen van je taak');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Render een taak item
  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        onPress={() => toggleTaskStatus(item.id, item.completed)}
        style={styles.checkbox}
      >
        <Ionicons
          name={item.completed ? 'checkbox' : 'square-outline'}
          size={24}
          color={item.completed ? '#34A853' : '#666'}
        />
      </TouchableOpacity>

      <ThemedText
        style={[
          styles.taskTitle,
          item.completed && styles.completedTaskTitle,
        ]}
      >
        {item.title}
      </ThemedText>

      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#EA4335" />
      </TouchableOpacity>
    </View>
  );

  // Berekenen van statistieken
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const remainingTasks = totalTasks - completedTasks;
  const progressPercentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  if (loading && tasks.length === 0) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: '#F1F1F1' }]}>
        <ActivityIndicator size="large" color="#43976A" />
        <ThemedText style={styles.loadingText}>Taken laden...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#F1F1F1' }]}>
      <AppHeader 
        title="Mijn Checklist"
        scrollY={scrollY}
      />
      
      <View style={styles.statsContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressIndicator,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
        
        <View style={styles.statsDetails}>
          <ThemedText style={styles.statItem}>
            Totaal: {totalTasks}
          </ThemedText>
          <ThemedText style={styles.statItem}>
            Voltooid: {completedTasks}
          </ThemedText>
          <ThemedText style={styles.statItem}>
            Resterend: {remainingTasks}
          </ThemedText>
        </View>
      </View>
      
      <Animated.FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            Je hebt nog geen taken. Voeg hieronder een nieuwe taak toe.
          </ThemedText>
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Nieuwe taak toevoegen..."
          returnKeyType="done"
          onSubmitEditing={addTask}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addTask}
          disabled={!newTaskTitle.trim() || loading}
        >
          <Ionicons
            name="add-circle"
            size={44}
            color={!newTaskTitle.trim() || loading ? '#ccc' : '#43976A'}
          />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    marginTop: 90,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#43976A',
  },
  statsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    fontSize: 14,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#888',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 18,
    marginRight: 12,
    fontSize: 16,
  },
  addButton: {
    marginRight: 5,
  },
}); 