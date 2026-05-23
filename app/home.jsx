import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Link, router } from 'expo-router';

import { signOut } from 'firebase/auth';

import { auth } from '../src/config/firebase';

export default function HomeScreen() {

  const handleLogout = async () => {
    await signOut(auth);

    router.replace('/login');
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Nostalgia
      </Text>

      <Text style={styles.subtitle}>
        Your memories map
      </Text>

      {/* MAP */}
      <Link href="/map" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>
            🗺 Open Map
          </Text>
        </TouchableOpacity>
      </Link>

      {/* ALBUM */}
      <Link href="/album" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>
            📸 Open Album
          </Text>
        </TouchableOpacity>
      </Link>

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logout}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#6B3F1D',
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  subtitle: {
    color: '#E8D3C0',
    textAlign: 'center',
    marginBottom: 35,
    marginTop: 5,
  },

  card: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
  },

  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B2A1A',
    textAlign: 'center',
  },

  logout: {
    marginTop: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#000',
  },

  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});