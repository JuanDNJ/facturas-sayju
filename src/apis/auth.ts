import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { appFirebase } from "./firebase";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export async function registerUser({ name, email, password }: RegisterInput) {
  const auth = getAuth(appFirebase);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const auth = getAuth(appFirebase);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  const auth = getAuth(appFirebase);
  await signOut(auth);
}

export async function requestPasswordReset(email: string) {
  const auth = getAuth(appFirebase);
  await sendPasswordResetEmail(auth, email);
}
