import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebase';

export default function HomeScreen() {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nostalgia</Text>
      <Text style={styles.subtitle}>Your memories map</Text>

      <Link href="/map" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>🗺️ Open Map</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/album" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>📸 Open Album</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/friends" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>👥 Friends</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#6B3F1D',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: '#E8D3C0',
    textAlign: 'center',
    marginBottom: 48,
    marginTop: 5,
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B2A1A',
    textAlign: 'center',
  },
  logout: {
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});