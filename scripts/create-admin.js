// Script para crear el primer administrador
// Ejecutar con: node scripts/create-admin.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Configuración de Firebase - reemplaza con tu configuración
const firebaseConfig = {
  // Tu configuración de Firebase aquí
  apiKey: "tu-api-key",
  authDomain: "tu-auth-domain",
  projectId: "tu-project-id",
  storageBucket: "tu-storage-bucket",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createAdmin() {
  try {
    // Reemplaza con el UID del usuario que quieres hacer admin
    const adminUserId = "UID_DEL_USUARIO_ADMIN";
    const adminEmail = "admin@example.com"; // Reemplaza con el email del admin
    
    const userRef = doc(db, 'users', adminUserId);
    
    await setDoc(userRef, {
      uid: adminUserId,
      email: adminEmail,
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Administrador creado exitosamente');
    console.log('UID:', adminUserId);
    console.log('Email:', adminEmail);
    console.log('Rol: admin');
    
  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
  }
}

createAdmin(); 