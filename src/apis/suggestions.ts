import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { appFirebase } from "./firebase";

const db = getFirestore(appFirebase);

export type Suggestion = {
  category: "mejora" | "error" | "necesidad" | "otro";
  title?: string;
  message: string;
  userId: string;
  userDisplay?: string;
  userEmail?: string;
  createdAt?: Timestamp;
};

export async function addSuggestion(data: Omit<Suggestion, "createdAt">) {
  const colRef = collection(db, "suggestions");
  const docToSave = { ...data, createdAt: serverTimestamp() };
  const res = await addDoc(colRef, docToSave);
  return res.id;
}
