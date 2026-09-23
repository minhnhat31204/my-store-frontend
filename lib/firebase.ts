import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw new Error(`Firebase chưa được cấu hình: ${missing.join(', ')}`);
  }

  return config as typeof config & { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string };
}

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') throw new Error('Firebase Auth chỉ khả dụng trên trình duyệt.');
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  return app;
}

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') throw new Error('Firebase Auth chỉ khả dụng trên trình duyệt.');
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}
