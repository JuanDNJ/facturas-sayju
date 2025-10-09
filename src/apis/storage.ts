import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { appFirebase } from './firebase'

/**
 * Sube un avatar para el usuario y devuelve la URL de descarga.
 * La ruta será users/{uid}/avatar/{timestamp}_{filename}
 */
export async function uploadUserAvatar(uid: string, file: File): Promise<string> {
  const storage = getStorage(appFirebase)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `users/${uid}/avatar/${Date.now()}_${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type })
  const url = await getDownloadURL(storageRef)
  return url
}

/**
 * Sube el logo de un sello y devuelve la URL de descarga.
 * La ruta será users/{uid}/stamps/{timestamp}_{filename}
 */
export async function uploadStampLogo(uid: string, file: File): Promise<string> {
  const storage = getStorage(appFirebase)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `users/${uid}/stamps/${Date.now()}_${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type })
  const url = await getDownloadURL(storageRef)
  return url
}
