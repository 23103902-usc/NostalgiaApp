import { initializeApp, getApps, getApp } from 'firebase/app';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Yyz9WbBxwhJOwpXswPMDHe_YXMUp81Y",
  authDomain: "nostalgiaapp-506a6.firebaseapp.com",
  projectId: "nostalgiaapp-506a6",
  storageBucket: "nostalgiaapp-506a6.firebasestorage.app",
  messagingSenderId: "734162053091",
  appId: "1:734162053091:web:9d1fa1614195e7bf21e2d6"
};

// prevent duplicate Firebase app
const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

// persistent auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(
    AsyncStorage
  ),
});

export const db = getFirestore(app);