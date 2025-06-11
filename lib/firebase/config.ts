import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBMO5JO_tSoxa1sYCIy7oubnXsh8YlhmuY",
    authDomain: "boletera-375d2.firebaseapp.com",
    projectId: "boletera-375d2",
    storageBucket: "boletera-375d2.firebasestorage.app",
    messagingSenderId: "872308082882",
    appId: "1:872308082882:web:ffa4a9de52986c7d21d35b",
    measurementId: "G-TPQMB4NBMF"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);



// Helper function to read venue data from Firestore
export async function readVenueData(venueId: string): Promise<DocumentData | null> {
  try {
    const venueRef = doc(db, 'venues', venueId);
    const venueSnap = await getDoc(venueRef);
    
    if (venueSnap.exists()) {
      return venueSnap.data();
    } else {
      console.log('No venue found with ID:', venueId);
      return null;
    }
  } catch (error) {
    console.error('Error reading venue data:', error);
    throw error;
  }
}

// Helper function to write venue data to Firestore
export async function writeVenueData(venueId: string, data: any): Promise<void> {
  try {
    const venueRef = doc(db, 'venues', venueId);
    await setDoc(venueRef, data, { merge: true });
    console.log('Venue data written successfully');
  } catch (error) {
    console.error('Error writing venue data:', error);
    throw error;
  }
}

// Helper function to read seats data from Firestore
export async function readSeatsData(venueId: string): Promise<DocumentData | null> {
  try {
    const seatsRef = doc(db, 'venues', venueId, 'data', 'seats');
    const seatsSnap = await getDoc(seatsRef);
    
    if (seatsSnap.exists()) {
      return seatsSnap.data();
    } else {
      console.log('No seats data found for venue:', venueId);
      return null;
    }
  } catch (error) {
    console.error('Error reading seats data:', error);
    throw error;
  }
}

// Helper function to write seats data to Firestore
export async function writeSeatsData(venueId: string, seatsData: any): Promise<void> {
  try {
    const seatsRef = doc(db, 'venues', venueId, 'data', 'seats');
    await setDoc(seatsRef, seatsData, { merge: true });
    console.log('Seats data written successfully');
  } catch (error) {
    console.error('Error writing seats data:', error);
    throw error;
  }
}

// Helper function to upload a file to Firebase Storage
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File uploaded successfully');
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Helper function to delete a file from Firebase Storage
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Helper function to get a download URL for a file
export async function getFileURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    console.log('File URL:', url);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

export { db, storage }; 