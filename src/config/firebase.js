import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGlnRMr14mETe9UAdQ-RlmFbaIdS8N3J4",
  authDomain: "thesistrack-d552a.firebaseapp.com",
  projectId: "thesistrack-d552a",
  storageBucket: "thesistrack-d552a.firebasestorage.app",
  messagingSenderId: "174426043020",
  appId: "1:174426043020:web:82c7337f597fc0a7b001a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;