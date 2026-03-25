import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function register(
  email: string,
  password: string,
  name: string,
  birthdate: string,
  country: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    birthdate,
    country,
    photoURL: null,
    createdAt: new Date().toISOString(),
  });
  return cred.user;
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<{
    name: string;
    birthdate: string;
    country: string;
    photoURL: string;
  }>,
) {
  await updateDoc(doc(db, "users", uid), data);
}
