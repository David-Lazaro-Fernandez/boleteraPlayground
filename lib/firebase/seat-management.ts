import { ref, getDownloadURL, uploadString } from "firebase/storage";
import { storage } from "./config";

// Interfaces para el manejo de asientos
interface VenueConfigSeat {
  id: string;
  x: number;
  y: number;
  zone: string;
  zoneName: string;
  color: string;
  price: number;
  status: string;
  rowLetter: string;
  seatNumber: number;
  lineId?: string;
  lineIndex?: number;
}

interface VenueConfig {
  venue: {
    name: string;
    type: string;
    capacity: number;
    layout: string;
  };
  ruedo: {
    centerX: number;
    centerY: number;
    radius: number;
  };
  createdSeats: VenueConfigSeat[];
  exportDate: string;
}

interface SeatToUpdate {
  id: string;
  status: 'available' | 'occupied' | 'reserved' | 'sold';
}

/**
 * Función para actualizar el estado de los asientos en Firebase Storage
 * Funciona tanto para ventas locales como para webhooks
 */
export async function updateSeatsStatus(
  seatsToUpdate: SeatToUpdate[],
  fileName: string = "Seats_data_last_actualizado.json"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener la configuración actual del venue desde Firebase Storage
    const fileRef = ref(storage, fileName);
    const downloadURL = await getDownloadURL(fileRef);
    const response = await fetch(downloadURL);
    
    if (!response.ok) {
      throw new Error(`Error fetching venue config: ${response.status}`);
    }
    
    const venueConfig: VenueConfig = await response.json();

    // Actualizar el estado de los asientos
    const updatedSeats = venueConfig.createdSeats.map((seat: VenueConfigSeat) => {
      const seatUpdate = seatsToUpdate.find(s => s.id === seat.id);
      if (seatUpdate) {
        return { ...seat, status: seatUpdate.status };
      }
      return seat;
    });

    // Crear la configuración actualizada
    const updatedVenueConfig: VenueConfig = {
      ...venueConfig,
      createdSeats: updatedSeats,
      exportDate: new Date().toISOString(), // Actualizar fecha de exportación
    };

    // Convertir a JSON string
    const jsonString = JSON.stringify(updatedVenueConfig, null, 2);

    // Subir la configuración actualizada a Firebase Storage
    await uploadString(fileRef, jsonString, "raw", {
      contentType: "application/json",
    });

    console.log(`Successfully updated ${seatsToUpdate.length} seats in ${fileName}`);
    return { success: true };

  } catch (error) {
    console.error("Error updating seats status:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Función para actualizar asientos basado en items del carrito
 * Convierte los items del carrito al formato necesario para la actualización
 */
export async function updateSeatsFromCartItems(
  cartItems: any[],
  newStatus: 'occupied' | 'reserved' | 'sold' = 'occupied'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extraer solo los asientos específicos (no generales)
    const seatsToUpdate: SeatToUpdate[] = cartItems
      .filter(item => item.type === 'seat' && item.id)
      .map(item => ({
        id: item.id,
        status: newStatus
      }));

    if (seatsToUpdate.length === 0) {
      console.log("No specific seats to update (only general tickets)");
      return { success: true };
    }

    // Actualizar los asientos
    const result = await updateSeatsStatus(seatsToUpdate);
    
    if (result.success) {
      console.log(`Successfully updated ${seatsToUpdate.length} seats from cart items`);
    }
    
    return result;

  } catch (error) {
    console.error("Error updating seats from cart items:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Función para liberar asientos (cambiar status a available)
 * Útil para casos donde se cancela una compra o se libera una reserva
 */
export async function releaseSeats(
  seatIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const seatsToUpdate: SeatToUpdate[] = seatIds.map(id => ({
    id,
    status: 'available'
  }));

  return await updateSeatsStatus(seatsToUpdate);
}

/**
 * Función para obtener la configuración actual de asientos
 * Útil para verificar estados o realizar validaciones
 */
export async function getCurrentSeatsConfig(
  fileName: string = "Seats_data_last_actualizado.json"
): Promise<{ success: boolean; data?: VenueConfig; error?: string }> {
  try {
    const fileRef = ref(storage, fileName);
    const downloadURL = await getDownloadURL(fileRef);
    const response = await fetch(downloadURL);
    
    if (!response.ok) {
      throw new Error(`Error fetching venue config: ${response.status}`);
    }
    
    const venueConfig: VenueConfig = await response.json();
    
    return { success: true, data: venueConfig };

  } catch (error) {
    console.error("Error getting current seats config:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Función para validar si los asientos están disponibles
 * Útil para verificar antes de procesar una compra
 */
export async function validateSeatsAvailability(
  seatIds: string[]
): Promise<{ success: boolean; availableSeats: string[]; unavailableSeats: string[]; error?: string }> {
  try {
    const configResult = await getCurrentSeatsConfig();
    
    if (!configResult.success || !configResult.data) {
      return {
        success: false,
        availableSeats: [],
        unavailableSeats: seatIds,
        error: configResult.error || "Could not fetch seats configuration"
      };
    }

    const availableSeats: string[] = [];
    const unavailableSeats: string[] = [];

    seatIds.forEach(seatId => {
      const seat = configResult.data!.createdSeats.find(s => s.id === seatId);
      if (seat && seat.status === 'available') {
        availableSeats.push(seatId);
      } else {
        unavailableSeats.push(seatId);
      }
    });

    return {
      success: true,
      availableSeats,
      unavailableSeats
    };

  } catch (error) {
    console.error("Error validating seats availability:", error);
    return {
      success: false,
      availableSeats: [],
      unavailableSeats: seatIds,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 