import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  orderBy,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db } from "./config";

// Interfaces para Eventos
export type EventStatus = "activo" | "en_preventa" | "agotado" | "finalizado";

export interface Event {
  id?: string;
  nombre: string;
  descripcion: string;
  fecha: Date;
  hora: string; // formato "HH:mm"
  lugar_id: string;
  estado_venta: EventStatus;
  venta_en_linea: boolean;
  imagen_url: string;
  created_at: Date;
  updated_at: Date;
}

// Funciones para Eventos
export async function createEvent(
  event: Omit<Event, "id" | "created_at" | "updated_at">,
): Promise<string> {
  try {
    const eventsRef = collection(db, "events");
    const now = new Date();
    const docRef = await addDoc(eventsRef, {
      ...event,
      fecha: Timestamp.fromDate(event.fecha),
      created_at: Timestamp.fromDate(now),
      updated_at: Timestamp.fromDate(now),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEvent(
  eventId: string,
  event: Partial<Omit<Event, "id" | "created_at" | "updated_at">>,
): Promise<void> {
  try {
    const eventRef = doc(db, "events", eventId);
    const updateData: any = {
      ...event,
      updated_at: Timestamp.fromDate(new Date()),
    };

    if (event.fecha) {
      updateData.fecha = Timestamp.fromDate(event.fecha);
    }

    await updateDoc(eventRef, updateData);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
      const data = eventSnap.data();
      return {
        id: eventSnap.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event;
    }
    return null;
  } catch (error) {
    console.error("Error getting event:", error);
    throw error;
  }
}

export async function getActiveEvents(): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events");
    const q = query(
      eventsRef,
      where("estado_venta", "==", "activo"),
      orderBy("fecha", "desc"),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event;
    });
  } catch (error) {
    console.error("Error getting active events:", error);
    throw error;
  }
}

export async function getEventsByVenue(venueId: string): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events");
    const q = query(
      eventsRef,
      where("lugar_id", "==", venueId),
      orderBy("fecha"),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event;
    });
  } catch (error) {
    console.error("Error getting events by venue:", error);
    throw error;
  }
}

// Nueva función para obtener eventos activos o en preventa ordenados por fecha
export async function getUpcomingEvents(
  limitCount: number = 6,
): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events");

    // Consulta para eventos en preventa
    const preventaQuery = query(
      eventsRef,
      where("estado_venta", "==", "en_preventa"),
      orderBy("fecha", "asc"),
    );

    // Consulta para eventos activos
    const activoQuery = query(
      eventsRef,
      where("estado_venta", "==", "activo"),
      orderBy("fecha", "asc"),
    );

    // Ejecutar ambas consultas en paralelo
    const [preventaSnapshot, activoSnapshot] = await Promise.all([
      getDocs(preventaQuery),
      getDocs(activoQuery),
    ]);

    // Combinar y mapear los resultados
    const allEvents: Event[] = [];

    preventaSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      allEvents.push({
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event);
    });

    activoSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      allEvents.push({
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event);
    });

    // Ordenar por fecha y limitar
    return allEvents
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error getting upcoming events:", error);
    throw error;
  }
}

// Función para obtener todos los eventos
export async function getAllEvents(): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("fecha", "desc"));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event;
    });
  } catch (error) {
    console.error("Error getting all events:", error);
    throw error;
  }
}

// Función para buscar eventos por nombre
export async function searchEventsByName(searchTerm: string): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events");
    const querySnapshot = await getDocs(eventsRef);

    const events = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate(),
      } as Event;
    });

    // Filtrar por nombre localmente (Firestore no soporta búsqueda de texto completo nativa)
    return events.filter(
      (event) =>
        event.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  } catch (error) {
    console.error("Error searching events:", error);
    throw error;
  }
}
