import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

interface CheckoutUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Crea un usuario automáticamente basado en los datos del checkout
 * Si el usuario ya existe, devuelve su UID
 */
export async function createOrGetUserFromCheckout(userData: CheckoutUserData): Promise<string> {
  try {
    const { email, firstName, lastName, phone } = userData;
    
    // Verificar si ya existe un usuario con este email
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log('Usuario ya existe:', existingUser.uid);
      return existingUser.uid;
    }

    // Generar una contraseña temporal (el usuario puede cambiarla después)
    const temporaryPassword = generateTemporaryPassword();
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
    const user = userCredential.user;

    // Crear documento en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: email,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      role: 'user',
      isAutoCreated: true, // Marca que fue creado automáticamente
      hasSetPassword: false, // El usuario aún no ha establecido su contraseña
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('Usuario creado automáticamente:', user.uid);
    return user.uid;
    
  } catch (error) {
    console.error('Error creating user from checkout:', error);
    
    // Si el error es que el email ya existe, intentar obtener el usuario
    if (error instanceof Error && 'code' in error && error.code === 'auth/email-already-in-use') {
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        return existingUser.uid;
      }
    }
    
    throw error;
  }
}

/**
 * Busca un usuario por email en Firestore
 */
async function getUserByEmail(email: string): Promise<{uid: string} | null> {
  try {
    // Importar las funciones necesarias
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    
    // Crear consulta para buscar por email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Devolver el primer usuario encontrado
      const userDoc = querySnapshot.docs[0];
      return { uid: userDoc.id };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error searching user by email:', error);
    return null;
  }
}

/**
 * Genera una contraseña temporal segura
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

/**
 * Permite a un usuario reclamar su cuenta creada automáticamente
 */
export async function claimAutoCreatedAccount(email: string, newPassword: string): Promise<void> {
  try {
    // Esta función se usaría cuando un usuario quiere "reclamar" su cuenta
    // El usuario recibiría un email con un enlace para establecer su contraseña
    
    // Por ahora, solo actualizamos el documento en Firestore
    // En producción, implementarías un flujo de reset de contraseña
    
    console.log('Claiming account for:', email);
    // Implementación futura
    
  } catch (error) {
    console.error('Error claiming account:', error);
    throw error;
  }
}

/**
 * Envía un email de bienvenida al usuario auto-creado
 */
export async function sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
  try {
    // Esta función se integraría con tu servicio de email
    // Por ejemplo, con el backend que ya tienes para enviar boletos
    
    console.log('Sending welcome email to:', email);
    
    // Implementación futura - integrar con tu servicio de email
    // await emailService.sendWelcomeEmail({ email, firstName });
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // No lanzamos el error porque el email no es crítico
  }
} 