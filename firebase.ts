import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_Wkvthy4jCf72cwQBLQxPJ0DGBlS6Ou0",
  authDomain: "autohome-care.firebaseapp.com",
  projectId: "autohome-care",
  storageBucket: "autohome-care.firebasestorage.app",
  messagingSenderId: "682550823455",
  appId: "1:682550823455:web:a0c74cc41974491dc3a32a",
  measurementId: "G-0JMSPNPSW2",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
