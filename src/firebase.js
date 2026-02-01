/**
 * Firebase app and Firestore initialization.
 * Used by the incident portal to read/write incidents (MCP-style persistence layer).
 *
 * Demo alignment: Elastic Agent Builder analyzes logs (e.g. with ES|QL), determines
 * escalation_required, then invokes the MCP-style "Create Incident" tool—implemented
 * here as Firestore writes. This demonstrates tool-driven agents taking real
 * operational action (creating tickets) with Firebase as the persistence layer.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase project config (see README).
// For local demo, you can use a placeholder; set real values for Firestore to work.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
