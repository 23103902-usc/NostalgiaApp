import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';

import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';

import {
  doc,
  setDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
} from '../src/config/firebase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const userCred =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      // save user profile
      await setDoc(
        doc(db, 'users', userCred.user.uid),
        {
          email,
          createdAt: new Date().toISOString(),
        }
      );

      router.replace('/home');

    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Create Account
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>
          Register
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
      >
        <Text style={styles.link}>
          Back to Login
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#f2f2f2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },

  button: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 12,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  link: {
    marginTop: 20,
    textAlign: 'center',
    color: 'blue',
  },
});