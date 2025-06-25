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
  limit,
  deleteDoc,
  QuerySnapshot,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";

// Interfaces base
interface BaseMovement {
  total: number;
  subtotal: number;
  cargo_servicio: number;
  tipo_pago: "efectivo" | "tarjeta" | "cortesia";
}

// Interfaz para datos en Firestore
export interface FirestoreMovement extends BaseMovement {
  id: string;
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

export interface DashboardStats {
  ventasTotales: number;
  boletosVendidos: number;
  totalMovimientos: number;
  activosAhora: number;
  fondoCaja: number;
  ventasRecientes: {
    nombre: string;
    email: string;
    monto: number;
    fecha: Date;
    tipo_pago: "efectivo" | "tarjeta" | "cortesia";
    numero_boletos: number;
    subtotal: number;
    cargo_servicio: number;
  }[];
  ventasPorMes: {
    month: string;
    sales: number;
  }[];
  ventasPorDia: {
    date: string;
    sales: number;
  }[];
  ventasPorTipoPago: {
    efectivo: number;
    tarjeta: number;
    cortesia: number;
  };
  ventasPorZona: {
    zona: string;
    cantidad: number;
  }[];
  boletosPorTipoPago: {
    efectivo: number;
    tarjeta: number;
    cortesia: number;
  };
}

// Nueva interfaz para Fondo de Caja
export interface CashDrawerOpening {
  id?: string;
  date: Date;
  user_id: string;
  amount: number;
  created_at: Date;
  updated_at: Date;
}

// Interfaz para datos en Firestore
interface FirestoreCashDrawerOpening {
  id: string;
  date: Timestamp;
  user_id: string;
  amount: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Funciones para Movimientos
export async function createMovement(
  movement: BaseMovement & { fecha: Date },
): Promise<string> {
  try {
    const movementsRef = collection(db, "movements");
    const docRef = await addDoc(movementsRef, {
      ...movement,
      fecha: Timestamp.fromDate(movement.fecha),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating movement:", error);
    throw error;
  }
}

export async function getMovement(
  movementId: string,
): Promise<Movement | null> {
  try {
    const movementRef = doc(db, "movements", movementId);
    const movementSnap = await getDoc(movementRef);

    if (movementSnap.exists()) {
      const data = movementSnap.data();
      return {
        id: movementSnap.id,
        ...data,
        fecha: data.fecha,
      } as Movement;
    }
    return null;
  } catch (error) {
    console.error("Error getting movement:", error);
    throw error;
  }
}

// Funciones para Boletos
export async function createTicket(ticket: Ticket): Promise<string> {
  try {
    const ticketsRef = collection(db, "tickets");
    const docRef = await addDoc(ticketsRef, ticket);
    return docRef.id;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  try {
    const ticketRef = doc(db, "tickets", ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (ticketSnap.exists()) {
      const data = ticketSnap.data();
      return {
        id: ticketSnap.id,
        fila: data.fila,
        asiento: data.asiento,
        zona: data.zona,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting ticket:", error);
    throw error;
  }
}

export async function getTicketsByZone(zone: string): Promise<Ticket[]> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("zona", "==", zone));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Ticket,
    );
  } catch (error) {
    console.error("Error getting tickets by zone:", error);
    throw error;
  }
}

// Funciones para MovimientoBoletos
export async function createMovementTicket(
  movementTicket: MovementTicket,
): Promise<void> {
  try {
    const movementTicketsRef = collection(db, "movement_tickets");
    await addDoc(movementTicketsRef, movementTicket);
  } catch (error) {
    console.error("Error creating movement ticket:", error);
    throw error;
  }
}

export async function getTicketsByMovement(
  movementId: string,
): Promise<MovementTicket[]> {
  try {
    const movementTicketsRef = collection(db, "movement_tickets");
    const q = query(
      movementTicketsRef,
      where("movimiento_id", "==", movementId),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
        }) as MovementTicket,
    );
  } catch (error) {
    console.error("Error getting tickets by movement:", error);
    throw error;
  }
}

// Función de utilidad para crear una venta completa
export async function createSale(
  movement: Omit<Movement, "id">,
  tickets: Array<{ ticket: Omit<Ticket, "id">; precio: number }>,
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
        precio_vendido: precio,
      });
    }

    return movementId;
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
}

// Funciones para Lugares
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
      return {
        id: venueSnap.id,
        ...venueSnap.data(),
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
    const querySnapshot = await getDocs(query(venuesRef, orderBy("nombre")));

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Venue,
    );
  } catch (error) {
    console.error("Error getting all venues:", error);
    throw error;
  }
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
    const now = new Date();
    const updateData: any = {
      ...event,
      updated_at: Timestamp.fromDate(now),
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
    const querySnapshot = await getDocs(eventsRef);

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
    console.error("Error getting events:", error);
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

    const q = query(
      eventsRef,
      where("estado_venta", "in", ["en_preventa", "activo"]),
      orderBy("fecha", "asc"),
      limit(limitCount),
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
    console.error("Error getting upcoming events:", error);
    throw error;
  }
}

async function getTicketsInBatches(
  ticketIds: string[],
): Promise<QuerySnapshot<DocumentData>[]> {
  const batchSize = 30;
  const batches = [];

  for (let i = 0; i < ticketIds.length; i += batchSize) {
    const batch = ticketIds.slice(i, i + batchSize);
    const ticketsRef = collection(db, "tickets");
    const batchQuery = query(ticketsRef, where("__name__", "in", batch));
    batches.push(getDocs(batchQuery));
  }

  return Promise.all(batches);
}

export async function getDashboardStats(
  startDate: Date,
  endDate: Date,
): Promise<DashboardStats> {
  try {
    const movementsRef = collection(db, "movements");
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // 1. Obtener movimientos del día seleccionado
    const movementsQuery = query(
      movementsRef,
      where("fecha", ">=", startTimestamp),
      where("fecha", "<=", endTimestamp),
      orderBy("fecha", "desc"),
    );

    const movementsSnapshot = await getDocs(movementsQuery);
    const movements = movementsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        total: data.total,
        subtotal: data.subtotal,
        cargo_servicio: data.cargo_servicio,
        tipo_pago: data.tipo_pago,
        fecha: data.fecha.toDate(),
      } as Movement;
    });

    // Si no hay movimientos, retornar estadísticas vacías
    if (movements.length === 0) {
      return {
        ventasTotales: 0,
        boletosVendidos: 0,
        totalMovimientos: 0,
        activosAhora: 0,
        fondoCaja: 0,
        ventasRecientes: [],
        ventasPorMes: [],
        ventasPorDia: [],
        ventasPorTipoPago: {
          efectivo: 0,
          tarjeta: 0,
          cortesia: 0,
        },
        ventasPorZona: [],
        boletosPorTipoPago: {
          efectivo: 0,
          tarjeta: 0,
          cortesia: 0,
        },
      };
    }

    // Calcular ventas totales
    const ventasTotales = movements.reduce(
      (total, mov) => total + mov.total,
      0,
    );

    // 2. Obtener todos los movement_tickets para los movimientos del día
    const movementTicketsRef = collection(db, "movement_tickets");
    const movementTicketsQuery = query(
      movementTicketsRef,
      where(
        "movimiento_id",
        "in",
        movements.map((m) => m.id),
      ),
    );
    const movementTicketsSnapshot = await getDocs(movementTicketsQuery);

    // Crear un mapa de movimiento_id a número de boletos y sus IDs
    const boletosPorMovimiento = new Map<
      string,
      { count: number; ticketIds: string[] }
    >();

    movementTicketsSnapshot.docs.forEach((doc) => {
      const movementTicket = doc.data();
      const movimientoId = movementTicket.movimiento_id;
      const boletoId = movementTicket.boleto_id;

      const currentData = boletosPorMovimiento.get(movimientoId) || {
        count: 0,
        ticketIds: [],
      };
      boletosPorMovimiento.set(movimientoId, {
        count: currentData.count + 1,
        ticketIds: [...currentData.ticketIds, boletoId],
      });
    });

    // 3. Obtener todos los boletos únicos, excluyendo los de cortesía
    const allTicketIds = Array.from(
      new Set(
        Array.from(boletosPorMovimiento.entries())
          .filter(([movId]) => {
            const movement = movements.find((m) => m.id === movId);
            return movement && movement.tipo_pago !== "cortesia";
          })
          .flatMap(([_, data]) => data.ticketIds),
      ),
    );

    // 4. Obtener los boletos en lotes
    const ticketSnapshots = await getTicketsInBatches(allTicketIds);

    // 5. Procesar todos los tickets para estadísticas por zona
    const ventasPorZona = new Map<string, number>();
    ticketSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        const ticket = doc.data() as Ticket;
        const zonaCount = ventasPorZona.get(ticket.zona) || 0;
        ventasPorZona.set(ticket.zona, zonaCount + 1);
      });
    });

    const ventasPorZonaArray = Array.from(ventasPorZona.entries()).map(
      ([zona, cantidad]) => ({
        zona,
        cantidad,
      }),
    );

    // Contar boletos vendidos excluyendo cortesías
    const boletosVendidos = allTicketIds.length;

    // Ventas por tipo de pago
    const ventasPorTipoPago = {
      efectivo: movements.reduce(
        (sum, mov) => (mov.tipo_pago === "efectivo" ? sum + mov.total : sum),
        0,
      ),
      tarjeta: movements.reduce(
        (sum, mov) => (mov.tipo_pago === "tarjeta" ? sum + mov.total : sum),
        0,
      ),
      cortesia: movements.reduce(
        (sum, mov) => (mov.tipo_pago === "cortesia" ? sum + mov.total : sum),
        0,
      ),
    };

    // Total de movimientos
    const totalMovimientos = movements.length;

    // Activos ahora (usuarios con movimientos en la última hora)
    const unaHoraAtras = new Date();
    unaHoraAtras.setHours(unaHoraAtras.getHours() - 1);
    const activosQuery = query(
      movementsRef,
      where("fecha", ">=", Timestamp.fromDate(unaHoraAtras)),
      orderBy("fecha", "desc"),
    );
    const activosSnapshot = await getDocs(activosQuery);
    const activosAhora = activosSnapshot.size;

    // Ventas recientes con los datos correctos de la base de datos
    const ventasRecientes = movements.slice(0, 5).map((mov) => {
      const boletosData = boletosPorMovimiento.get(mov.id) || {
        count: 0,
        ticketIds: [],
      };
      return {
        nombre: "Usuario", // Campo por defecto ya que no existe en la base de datos
        email: "email@example.com", // Campo por defecto ya que no existe en la base de datos
        monto: mov.total,
        fecha: mov.fecha,
        tipo_pago: mov.tipo_pago,
        numero_boletos: boletosData.count,
        subtotal: mov.subtotal,
        cargo_servicio: mov.cargo_servicio,
      };
    });

    // Ventas por mes
    const ventasPorMes = new Map<string, number>();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    movements.forEach((mov) => {
      const fecha = mov.fecha;
      const monthKey = months[fecha.getMonth()];
      const currentAmount = ventasPorMes.get(monthKey) || 0;
      ventasPorMes.set(monthKey, currentAmount + mov.total);
    });

    const ventasPorMesArray = months.map((month) => ({
      month,
      sales: ventasPorMes.get(month) || 0,
    }));

    // Ventas por día
    const ventasPorDia = new Map<string, number>();

    movements.forEach((mov) => {
      const fecha = mov.fecha;
      // Usar la fecha directamente sin conversiones de timezone ya que se guarda correctamente
      const dateKey = fecha.toISOString().split("T")[0];
      const currentAmount = ventasPorDia.get(dateKey) || 0;
      ventasPorDia.set(dateKey, currentAmount + mov.total);
    });

    // Si estamos consultando un solo día (startDate y endDate son el mismo día),
    // filtrar solo ese día específico
    const isOneDayQuery = startDate.toDateString() === endDate.toDateString();
    const targetDateKey = startDate.toISOString().split("T")[0];

    let ventasPorDiaArray = Array.from(ventasPorDia.entries())
      .map(([date, sales]) => ({
        date,
        sales,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Si es consulta de un solo día, filtrar solo ese día
    if (isOneDayQuery) {
      ventasPorDiaArray = ventasPorDiaArray.filter(
        (item) => item.date === targetDateKey,
      );
    }

    // Contadores para boletos por tipo de pago
    const boletosPorTipoPago = {
      efectivo: 0,
      tarjeta: 0,
      cortesia: 0,
    };

    // Contar boletos por tipo de pago
    movements.forEach((mov) => {
      const boletosData = boletosPorMovimiento.get(mov.id);
      if (boletosData) {
        boletosPorTipoPago[mov.tipo_pago] += boletosData.count;
      }
    });

    // Obtener el fondo de caja del día seleccionado (solo para mostrar, no afecta los cálculos)
    const cashDrawer = await getCashDrawerOpening(startDate);
    const fondoCaja = cashDrawer?.amount || 0;

    return {
      ventasTotales,
      boletosVendidos,
      totalMovimientos,
      activosAhora,
      fondoCaja,
      ventasRecientes,
      ventasPorMes: ventasPorMesArray,
      ventasPorDia: ventasPorDiaArray,
      ventasPorTipoPago,
      ventasPorZona: ventasPorZonaArray,
      boletosPorTipoPago,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
}

// Funciones para Fondo de Caja
export async function createCashDrawerOpening(
  cashDrawer: Omit<CashDrawerOpening, "id" | "created_at" | "updated_at">,
): Promise<string> {
  try {
    const cashDrawerRef = collection(db, "cash_drawer_openings");
    const now = new Date();
    const docRef = await addDoc(cashDrawerRef, {
      ...cashDrawer,
      date: Timestamp.fromDate(cashDrawer.date),
      created_at: Timestamp.fromDate(now),
      updated_at: Timestamp.fromDate(now),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating cash drawer opening:", error);
    throw error;
  }
}

export async function getCashDrawerOpening(
  date: Date,
): Promise<CashDrawerOpening | null> {
  try {
    const cashDrawerRef = collection(db, "cash_drawer_openings");
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(normalizedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const q = query(
      cashDrawerRef,
      where("date", ">=", Timestamp.fromDate(normalizedDate)),
      where("date", "<", Timestamp.fromDate(nextDay)),
      limit(1),
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data() as FirestoreCashDrawerOpening;
      return {
        id: doc.id,
        date: data.date.toDate(),
        user_id: data.user_id,
        amount: data.amount,
        created_at: data.created_at.toDate(),
        updated_at: data.updated_at.toDate(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting cash drawer opening:", error);
    throw error;
  }
}

export async function updateCashDrawerOpening(
  id: string,
  amount: number,
  userId: string,
): Promise<void> {
  try {
    const cashDrawerRef = doc(db, "cash_drawer_openings", id);
    await updateDoc(cashDrawerRef, {
      amount: amount,
      user_id: userId,
      updated_at: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error updating cash drawer opening:", error);
    throw error;
  }
}

export async function cleanAllCollections(): Promise<void> {
  try {
    const collections = [
      "movements",
      "tickets",
      "movement_tickets",
      "venues",
      "events",
    ];

    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      // Delete documents in batches
      const batchSize = 500;
      const batches = [];
      let batch = [];

      for (const doc of snapshot.docs) {
        batch.push(doc.ref);

        if (batch.length === batchSize) {
          batches.push(batch);
          batch = [];
        }
      }

      if (batch.length > 0) {
        batches.push(batch);
      }

      // Execute deletion in parallel for each batch
      await Promise.all(
        batches.map(async (batchDocs) => {
          await Promise.all(batchDocs.map((docRef) => deleteDoc(docRef)));
        }),
      );
    }
  } catch (error) {
    console.error("Error cleaning collections:", error);
    throw error;
  }
}
