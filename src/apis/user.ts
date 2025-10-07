import { getFirestore, doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { appFirebase } from "./firebase";
import type { User as AppUser } from "../types/user.type";

export type UserProfileInput = Omit<AppUser, "createAt" | "updateAt"> & {
  createAt?: ReturnType<typeof serverTimestamp> | unknown;
  updateAt?: ReturnType<typeof serverTimestamp> | unknown;
};

const db = getFirestore(appFirebase);

export async function saveUserProfile(uid: string, data: Partial<UserProfileInput>) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const base: Partial<UserProfileInput> = {
    ...data,
    updateAt: serverTimestamp(),
  };
  if (snap.exists()) {
    await updateDoc(ref, base);
  } else {
    await setDoc(ref, {
      ...base,
      createAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}
