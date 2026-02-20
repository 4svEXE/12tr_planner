import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  EmailAuthProvider,
  linkWithCredential
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcTcIm0Seue-wWf8g9JVH3dy8bECL_oZ8",
  authDomain: "tr-e57b7.firebaseapp.com",
  projectId: "tr-e57b7",
  storageBucket: "tr-e57b7.firebasestorage.app",
  messagingSenderId: "431741978111",
  appId: "1:431741978111:web:85a1c4ec8f0d00614693ca",
  measurementId: "G-FE2KQTSSW8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  EmailAuthProvider,
  linkWithCredential
};
export type User = FirebaseUser;
