import { signInAnonymously } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

/**
 * Crea un usuario anónimo temporal para permitir compras
 * sin registro completo
 */
export async function createAnonymousUser(): Promise<string> {
  try {
    // Crear usuario anónimo en Firebase Auth
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Crear documento en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: '', // Sin email para usuarios anónimos
      role: 'user',
      isAnonymous: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return user.uid;
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    throw error;
  }
}

/**
 * Convierte un usuario anónimo en un usuario registrado
 */
export async function convertAnonymousUser(email: string, password: string): Promise<void> {
  try {
    const { linkWithCredential, EmailAuthProvider } = await import("firebase/auth");
    
    if (!auth.currentUser || !auth.currentUser.isAnonymous) {
      throw new Error('No hay usuario anónimo para convertir');
    }

    // Crear credencial de email/password
    const credential = EmailAuthProvider.credential(email, password);
    
    // Vincular la credencial al usuario anónimo
    await linkWithCredential(auth.currentUser, credential);
    
    // Actualizar el documento en Firestore
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, {
      email,
      isAnonymous: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
  } catch (error) {
    console.error('Error converting anonymous user:', error);
    throw error;
  }
} 