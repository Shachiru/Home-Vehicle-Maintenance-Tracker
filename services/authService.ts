import { auth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

export const signin = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signout = () => {
  return signOut(auth);
};

export const signup = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};
