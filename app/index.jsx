import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';

export default function Index() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return unsubscribe;
  }, []);

  // loading
  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // logged in
  if (user) {
    return <Redirect href="/home" />;
  }

  // not logged in
  return <Redirect href="/login" />;
}