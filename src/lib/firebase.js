// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASKb9oArM2luJmfHInERpwpc1ZyToC_3c",
  authDomain: "drawnguess-520db.firebaseapp.com",
  projectId: "drawnguess-520db",
  storageBucket: "drawnguess-520db.appspot.com",
  messagingSenderId: "130940931793",
  appId: "1:130940931793:web:8e3cdee8db906e477b3ff0",
  measurementId: "G-ZW9K78Z5M6"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDB = getDatabase(app);
