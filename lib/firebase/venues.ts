import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./config";

// Interfaz para Lugares
export interface Venue {
  id?: string;
  nombre: string;
  direccion?: string;
  ciudad: string;
  estado: string;
  pais: string;
}

// Funciones para Venues
export async function createVenue(venue: Omit<Venue, "id">): Promise<string> {
  try {
    const venuesRef = collection(db, "venues");
    const docRef = await addDoc(venuesRef, venue);
    return docRef.id;
  } catch (error) {
    console.error("Error creating venue:", error);
    throw error;
  }
}

export async function getVenue(venueId: string): Promise<Venue | null> {
  try {
    const venueRef = doc(db, "venues", venueId);
    const venueSnap = await getDoc(venueRef);

    if (venueSnap.exists()) {
      const data = venueSnap.data();
      return {
        id: venueSnap.id,
        nombre: data.nombre,
        direccion: data.direccion,
        ciudad: data.ciudad,
        estado: data.estado,
        pais: data.pais,
      } as Venue;
    }
    return null;
  } catch (error) {
    console.error("Error getting venue:", error);
    throw error;
  }
}

export async function getAllVenues(): Promise<Venue[]> {
  try {
    const venuesRef = collection(db, "venues");
    const q = query(venuesRef, orderBy("nombre"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        direccion: data.direccion,
        ciudad: data.ciudad,
        estado: data.estado,
        pais: data.pais,
      } as Venue;
    });
  } catch (error) {
    console.error("Error getting all venues:", error);
    throw error;
  }
}
