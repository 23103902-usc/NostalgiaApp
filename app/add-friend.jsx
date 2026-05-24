import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { sendFriendRequest } from '../src/services/friends';

export default function AddFriendScreen() {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  
  // ... implementation
}