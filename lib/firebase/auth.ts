import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
  AuthError,
} from "firebase/auth";
import { auth } from "./config";

export type AuthResult = {
  user: User | null;
  error: string | null;
};

// Función para iniciar sesión
export async function signInUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return {
      user: userCredential.user,
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "Error al iniciar sesión";

    switch (authError.code) {
      case "auth/user-not-found":
        errorMessage = "No existe una cuenta con este correo electrónico";
        break;
      case "auth/wrong-password":
        errorMessage = "Contraseña incorrecta";
        break;
      case "auth/invalid-email":
        errorMessage = "Correo electrónico inválido";
        break;
      case "auth/user-disabled":
        errorMessage = "Esta cuenta ha sido deshabilitada";
        break;
      case "auth/invalid-login-credentials":
        errorMessage = "Credenciales de inicio de sesión inválidas";
        break;
      case "auth/too-many-requests":
        errorMessage = "Demasiados intentos fallidos. Inténtalo más tarde";
        break;
      default:
        errorMessage = "Error al iniciar sesión. Inténtalo de nuevo";
    }

    return {
      user: null,
      error: errorMessage,
    };
  }
}

// Función para cerrar sesión
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
}

// Función para crear una nueva cuenta
export async function createUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return {
      user: userCredential.user,
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "Error al crear la cuenta";

    switch (authError.code) {
      case "auth/email-already-in-use":
        errorMessage = "Ya existe una cuenta con este correo electrónico";
        break;
      case "auth/invalid-email":
        errorMessage = "Correo electrónico inválido";
        break;
      case "auth/weak-password":
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
        break;
      default:
        errorMessage = "Error al crear la cuenta. Inténtalo de nuevo";
    }

    return {
      user: null,
      error: errorMessage,
    };
  }
}

// Función para restablecer contraseña
export async function resetPassword(
  email: string,
): Promise<{ error: string | null }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "Error al enviar el correo de restablecimiento";

    switch (authError.code) {
      case "auth/user-not-found":
        errorMessage = "No existe una cuenta con este correo electrónico";
        break;
      case "auth/invalid-email":
        errorMessage = "Correo electrónico inválido";
        break;
      default:
        errorMessage = "Error al enviar el correo. Inténtalo de nuevo";
    }

    return { error: errorMessage };
  }
}

// Función para obtener el usuario actual
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
