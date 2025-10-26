import { getFunctions, httpsCallable } from 'firebase/functions';
import { appFirebase } from './firebase';

const functions = getFunctions(appFirebase);

export const helloWorld = httpsCallable(functions, 'helloWorld');
export const getServerTimestamp = httpsCallable(functions, 'getServerTimestamp');