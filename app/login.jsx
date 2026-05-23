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
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { auth } from '../src/config/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      router.replace('/home');

    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Nostalgia
      </Text>

      <Text style={styles.subtitle}>
        Login to continue
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
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/register')}
      >
        <Text style={styles.link}>
          Create Account
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
  },

  subtitle: {
    textAlign: 'center',
    color: 'gray',
    marginBottom: 30,
    marginTop: 5,
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