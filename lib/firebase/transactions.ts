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
  DocumentReference,
  DocumentData,
  orderBy,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from './config';

// Interfaces base
interface BaseMovement {
  total: number;
  nombre?: string;
  email?: string;
  subtotal?: number;
  cargo_servicio?: number;
}

// Interfaz para datos en Firestore
export interface FirestoreMovement extends BaseMovement {
  fecha: Timestamp;
}

// Interfaz para uso en la aplicación
export interface Movement extends BaseMovement {
  id: string;
  fecha: Date;
}

export interface Ticket {
  id?: string;
  fila: string;
  asiento: number;
  zona: string;
}

export interface MovementTicket {
  movimiento_id: string;
  boleto_id: string;
  precio_vendido: number;
}

// Nueva interfaz para Lugares
export interface Venue {
  id?: string;
  nombre: string;
  direccion?: string;
  ciudad: string;
  estado: string;
  pais: string;
}

// Nueva interfaz para Eventos
export type EventStatus = 'activo' | 'en_preventa' | 'agotado' | 'finalizado';

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

export interface DashboardStats {
  ventasTotales: number;
  boletosVendidos: number;
  totalMovimientos: number;
  activosAhora: number;
  ventasRecientes: {
    nombre: string;
    email: string;
    monto: number;
    fecha: Date;
  }[];
  ventasPorMes: {
    month: string;
    sales: number;
  }[];
}

// Funciones para Movimientos
export async function createMovement(movement: BaseMovement & { fecha: Date }): Promise<string> {
  try {
    const movementsRef = collection(db, 'movements');
    const docRef = await addDoc(movementsRef, {
      ...movement,
      fecha: Timestamp.fromDate(movement.fecha)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating movement:', error);
    throw error;
  }
}

export async function getMovement(movementId: string): Promise<Movement | null> {
  try {
    const movementRef = doc(db, 'movements', movementId);
    const movementSnap = await getDoc(movementRef);
    
    if (movementSnap.exists()) {
      const data = movementSnap.data();
      return {
        id: movementSnap.id,
        ...data,
        fecha: data.fecha
      } as Movement;
    }
    return null;
  } catch (error) {
    console.error('Error getting movement:', error);
    throw error;
  }
}

// Funciones para Boletos
export async function createTicket(ticket: Ticket): Promise<string> {
  try {
    const ticketsRef = collection(db, 'tickets');
    const docRef = await addDoc(ticketsRef, ticket);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (ticketSnap.exists()) {
      const data = ticketSnap.data();
      return {
        id: ticketSnap.id,
        fila: data.fila,
        asiento: data.asiento,
        zona: data.zona
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting ticket:', error);
    throw error;
  }
}

export async function getTicketsByZone(zone: string): Promise<Ticket[]> {
  try {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('zona', '==', zone));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ticket));
  } catch (error) {
    console.error('Error getting tickets by zone:', error);
    throw error;
  }
}

// Funciones para MovimientoBoletos
export async function createMovementTicket(movementTicket: MovementTicket): Promise<void> {
  try {
    const movementTicketsRef = collection(db, 'movement_tickets');
    await addDoc(movementTicketsRef, movementTicket);
  } catch (error) {
    console.error('Error creating movement ticket:', error);
    throw error;
  }
}

export async function getTicketsByMovement(movementId: string): Promise<MovementTicket[]> {
  try {
    const movementTicketsRef = collection(db, 'movement_tickets');
    const q = query(movementTicketsRef, where('movimiento_id', '==', movementId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data()
    } as MovementTicket));
  } catch (error) {
    console.error('Error getting tickets by movement:', error);
    throw error;
  }
}

// Función de utilidad para crear una venta completa
export async function createSale(
  movement: Omit<Movement, 'id'>,
  tickets: Array<{ ticket: Omit<Ticket, 'id'>, precio: number }>
): Promise<string> {
  try {
    // 1. Crear el movimiento
    const movementId = await createMovement(movement);

    // 2. Para cada boleto
    for (const { ticket, precio } of tickets) {
      // 2.1 Crear el boleto
      const ticketId = await createTicket(ticket);
      
      // 2.2 Crear la relación movimiento-boleto
      await createMovementTicket({
        movimiento_id: movementId,
        boleto_id: ticketId,
        precio_vendido: precio
      });
    }

    return movementId;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
}

// Funciones para Lugares
export async function createVenue(venue: Omit<Venue, 'id'>): Promise<string> {
  try {
    const venuesRef = collection(db, 'venues');
    const docRef = await addDoc(venuesRef, venue);
    return docRef.id;
  } catch (error) {
    console.error('Error creating venue:', error);
    throw error;
  }
}

export async function getVenue(venueId: string): Promise<Venue | null> {
  try {
    const venueRef = doc(db, 'venues', venueId);
    const venueSnap = await getDoc(venueRef);
    
    if (venueSnap.exists()) {
      return {
        id: venueSnap.id,
        ...venueSnap.data()
      } as Venue;
    }
    return null;
  } catch (error) {
    console.error('Error getting venue:', error);
    throw error;
  }
}

export async function getAllVenues(): Promise<Venue[]> {
  try {
    const venuesRef = collection(db, 'venues');
    const querySnapshot = await getDocs(query(venuesRef, orderBy('nombre')));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Venue));
  } catch (error) {
    console.error('Error getting all venues:', error);
    throw error;
  }
}

// Funciones para Eventos
export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const eventsRef = collection(db, 'events');
    const now = new Date();
    const docRef = await addDoc(eventsRef, {
      ...event,
      fecha: Timestamp.fromDate(event.fecha),
      created_at: Timestamp.fromDate(now),
      updated_at: Timestamp.fromDate(now)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

export async function updateEvent(eventId: string, event: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    const now = new Date();
    const updateData: any = {
      ...event,
      updated_at: Timestamp.fromDate(now)
    };
    
    if (event.fecha) {
      updateData.fecha = Timestamp.fromDate(event.fecha);
    }
    
    await updateDoc(eventRef, updateData);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

export async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      const data = eventSnap.data();
      return {
        id: eventSnap.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate()
      } as Event;
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
}

export async function getActiveEvents(): Promise<Event[]> {
  try {
    const eventsRef = collection(db, 'events');
    const querySnapshot = await getDocs(eventsRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate()
      } as Event;
    });
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
}

export async function getEventsByVenue(venueId: string): Promise<Event[]> {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('lugar_id', '==', venueId),
      orderBy('fecha')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: (data.fecha as Timestamp).toDate(),
        created_at: (data.created_at as Timestamp).toDate(),
        updated_at: (data.updated_at as Timestamp).toDate()
      } as Event;
    });
  } catch (error) {
    console.error('Error getting events by venue:', error);
    throw error;
  }
}

export async function getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats> {
  try {
    const movementsRef = collection(db, 'movements');
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const movementsQuery = query(
      movementsRef,
      where('fecha', '>=', startTimestamp),
      where('fecha', '<=', endTimestamp),
      orderBy('fecha', 'desc')
    );

    const movementsSnapshot = await getDocs(movementsQuery);
    const movements = movementsSnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreMovement;
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha.toDate()
      };
    });

    // Calcular ventas totales
    const ventasTotales = movements.reduce((total, mov) => total + mov.total, 0);

    // Obtener boletos vendidos
    const movementTicketsRef = collection(db, 'movement_tickets');
    const ticketsSnapshot = await getDocs(movementTicketsRef);
    const boletosVendidos = ticketsSnapshot.size;

    // Total de movimientos
    const totalMovimientos = movements.length;

    // Activos ahora (usuarios con movimientos en la última hora)
    const unaHoraAtras = new Date();
    unaHoraAtras.setHours(unaHoraAtras.getHours() - 1);
    const activosQuery = query(
      movementsRef,
      where('fecha', '>=', Timestamp.fromDate(unaHoraAtras)),
      orderBy('fecha', 'desc')
    );
    const activosSnapshot = await getDocs(activosQuery);
    const activosAhora = activosSnapshot.size;

    // Ventas recientes
    const ventasRecientesQuery = query(
      movementsRef,
      orderBy('fecha', 'desc'),
      limit(5)
    );
    const ventasRecientesSnapshot = await getDocs(ventasRecientesQuery);
    const ventasRecientes = ventasRecientesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        nombre: data.nombre || 'Usuario',
        email: data.email || 'email@example.com',
        monto: data.total,
        fecha: data.fecha.toDate()
      };
    });

    // Ventas por mes
    const ventasPorMes = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    movements.forEach(mov => {
      const fecha = mov.fecha;
      const monthKey = months[fecha.getMonth()];
      const currentAmount = ventasPorMes.get(monthKey) || 0;
      ventasPorMes.set(monthKey, currentAmount + mov.total);
    });

    const ventasPorMesArray = months.map(month => ({
      month,
      sales: ventasPorMes.get(month) || 0
    }));

    return {
      ventasTotales,
      boletosVendidos,
      totalMovimientos,
      activosAhora,
      ventasRecientes,
      ventasPorMes: ventasPorMesArray
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
} 