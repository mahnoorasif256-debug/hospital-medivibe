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
    apiKey: "AIzaSyAKfL5nOF5nMsJXAolll5-kNFvjuOK63Ng",
    authDomain: "medivibe-f6e7b.firebaseapp.com",
    projectId: "medivibe-f6e7b",
    storageBucket: "medivibe-f6e7b.firebasestorage.app",
    messagingSenderId: "358773330898",
    appId: "1:358773330898:web:10a546f0661f8aa912ee0b"
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
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove 
};