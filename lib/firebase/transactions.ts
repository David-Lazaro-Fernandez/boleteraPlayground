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
import process from "process";

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
export async function createMovement(movementData: {
  total: number;
  subtotal: number;
  cargo_servicio: number;
  tipo_pago: string;
  buyer_email?: string;
  buyer_name?: string;
  event_id?: string;
  payment_intent_id?: string;
  session_id?: string;
  metadata?: any;
}): Promise<string> {
  try {
    const movement = {
      ...movementData,
      fecha: Timestamp.fromDate(new Date()),
      status: 'pending',
      created_at: Timestamp.fromDate(new Date()),
      updated_at: Timestamp.fromDate(new Date())
    };

    const movementsRef = collection(db, 'movements');
    const docRef = await addDoc(movementsRef, movement);
    console.log('Movement created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating movement:', error);
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
export async function createTickets(items: any[]): Promise<string[]> {
  try {
    const ticketIds: string[] = [];
    const ticketsRef = collection(db, 'tickets');
    
    for (const item of items) {
      if (item.type === 'seat') {
        // Crear ticket para asiento específico
        const ticketData = {
          zona: item.zoneName,
          fila: item.rowLetter,
          asiento: item.seatNumber,
          precio: item.price,
          event_id: item.eventId || null,
          status: 'reserved',
          created_at: Timestamp.fromDate(new Date()),
          updated_at: Timestamp.fromDate(new Date())
        };

        const ticketRef = await addDoc(ticketsRef, ticketData);
        ticketIds.push(ticketRef.id);
      } else if (item.type === 'general') {
        // Crear tickets generales
        const quantity = item.quantity || 1;
        for (let i = 0; i < quantity; i++) {
          const ticketData = {
            zona: item.zoneName,
            fila: 'General',
            asiento: 0,
            precio: item.price,
            event_id: item.eventId || null,
            status: 'reserved',
            created_at: Timestamp.fromDate(new Date()),
            updated_at: Timestamp.fromDate(new Date())
          };

          const ticketRef = await addDoc(ticketsRef, ticketData);
          ticketIds.push(ticketRef.id);
        }
      }
    }

    return ticketIds;
  } catch (error) {
    console.error('Error creating tickets:', error);
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
export async function createMovementTickets(movementId: string, ticketIds: string[], items: any[]): Promise<void> {
  try {
    const movementTicketsRef = collection(db, 'movement_tickets');
    let itemIndex = 0;
    
    for (const ticketId of ticketIds) {
      // Encontrar el item correspondiente a este ticket
      let currentItem = items[itemIndex];
      
      const movementTicketData = {
        movimiento_id: movementId,
        boleto_id: ticketId,
        precio_vendido: currentItem.price,
        created_at: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date())
      };

      await addDoc(movementTicketsRef, movementTicketData);
      
      // Avanzar al siguiente item si es necesario
      if (currentItem.type === 'seat' || (currentItem.type === 'general' && ticketIds.indexOf(ticketId) % (currentItem.quantity || 1) === (currentItem.quantity || 1) - 1)) {
        itemIndex++;
      }
    }
  } catch (error) {
    console.error('Error creating movement tickets:', error);
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
      // 2.1 Transformar la estructura de datos para createTickets
      const ticketForCreation = {
        type: ticket.fila === "GENERAL" ? "general" : "seat",
        zoneName: ticket.zona,
        rowLetter: ticket.fila,
        seatNumber: ticket.asiento,
        price: precio,
        quantity: ticket.fila === "GENERAL" ? 1 : undefined,
      };

      // 2.2 Crear el boleto
      const ticketIds = await createTickets([ticketForCreation]);
      const ticketId = ticketIds[0];

      // 2.3 Verificar que el ticketId no sea undefined
      if (!ticketId) {
        throw new Error("Failed to create ticket: ticketId is undefined");
      }

      // 2.4 Crear la relación movimiento-boleto
      await createMovementTickets(movementId, [ticketId], [ticketForCreation]);
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

/**
 * Actualizar el estado de un movimiento
 */
export async function updateMovementStatus(movementId: string, status: 'paid' | 'cancelled', additionalData?: any): Promise<void> {
  try {
    const updateData = {
      status,
      updated_at: Timestamp.fromDate(new Date()),
      ...additionalData
    };

    const movementRef = doc(db, 'movements', movementId);
    await updateDoc(movementRef, updateData);
    console.log('Movement status updated:', movementId, status);
  } catch (error) {
    console.error('Error updating movement status:', error);
    throw error;
  }
}

/**
 * Llamar al backend Express para procesar el pago
 */
export async function processPaymentWithBackend(movementId: string, status: 'paid' | 'cancelled'): Promise<any> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5102';
    
    console.log(`Calling backend at ${backendUrl}/api/tickets/process-payment`);
    console.log(`Movement ID: ${movementId}, Status: ${status}`);
    
    const response = await fetch(`${backendUrl}/api/tickets/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movementId,
        status
      })
    });

    console.log(`Backend response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      throw new Error(`Backend response error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Backend processing result:', result);
    
    return {
      success: true,
      data: result,
      backendResponse: true
    };
  } catch (error) {
    console.error('Error calling backend:', error);
    
    // Distinguir entre diferentes tipos de errores
    let errorMessage = 'Unknown error';
    let errorType = 'unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('fetch')) {
        errorType = 'network';
      } else if (error.message.includes('404')) {
        errorType = 'not_found';
      } else if (error.message.includes('500')) {
        errorType = 'server_error';
      } else if (error.message.includes('timeout')) {
        errorType = 'timeout';
      }
    }
    
    console.error(`Backend error type: ${errorType}, message: ${errorMessage}`);
    
    // Retornar información detallada del error sin lanzar excepción
    return { 
      success: false, 
      error: errorMessage,
      errorType,
      backendResponse: false
    };
  }
}
