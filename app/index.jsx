import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

import { initAuth, db } from '../src/config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Home() {

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      await initAuth();

      await addDoc(collection(db, "test"), {
        message: "Working 🎉",
        createdAt: new Date(),
      });

      console.log("🔥 FIREBASE WORKING");

    } catch (e) {
      console.log("❌ ERROR:", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nostalgia</Text>
      <Text style={styles.subtitle}>Testing Firebase...</Text>

      <Link href="/map" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>🗺 Map</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/album" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📸 Album</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B3F1D',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8D3C0',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B2A1A',
  },
});