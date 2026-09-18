import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc,
  doc, 
  onSnapshot,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRDPY9UKfP0lLTlWqUDgY3QcCY0B8lTTc",
  authDomain: "medivibe-1a3b8.firebaseapp.com",
  projectId: "medivibe-1a3b8",
  storageBucket: "medivibe-1a3b8.firebasestorage.app",
  messagingSenderId: "52837557277",
  appId: "1:52837557277:web:719fd0aff105b6657112f4"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/docmtwzxm/image/upload";
export const CLOUDINARY_UPLOAD_PRESET = "blog_preset";

googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged, 
  collection,
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc,
  doc, 
  onSnapshot,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove 
};