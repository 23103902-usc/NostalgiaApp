import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1Yyz9WbBxwhJOwpXswPMDHe_YXMUp81Y",
  authDomain: "nostalgiaapp-506a6.firebaseapp.com",
  projectId: "nostalgiaapp-506a6",
  storageBucket: "nostalgiaapp-506a6.firebasestorage.app",
  messagingSenderId: "734162053091",
  appId: "1:734162053091:web:9d1fa1614195e7bf21e2d6"
};

const app = initializeApp(firebaseConfig);

// Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 🔥 auto login (important for testing)
export const initAuth = async () => {
  try {
    await signInAnonymously(auth);
    console.log("User signed in");
  } catch (e) {
    console.log("Auth error:", e);
  }
};