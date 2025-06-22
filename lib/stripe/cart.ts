import { CartItem, CartSummary } from './types'

// Constante para el cargo por servicio (18%)
export const SERVICE_CHARGE_RATE = 0.18

/**
 * Calcula el resumen del carrito con subtotal, cargo por servicio y total
 */
export function calculateCartSummary(items: CartItem[]): CartSummary {
  const subtotal = items.reduce((sum, item) => {
    if (item.type === 'general') {
      return sum + (item.price * (item.quantity || 1))
    }
    return sum + item.price
  }, 0)

  const serviceCharge = subtotal * SERVICE_CHARGE_RATE
  const total = subtotal + serviceCharge

  const totalItems = items.reduce((sum, item) => {
    return sum + (item.quantity || 1)
  }, 0)

  return {
    items,
    subtotal,
    serviceCharge,
    total,
    totalItems,
    isEmpty: items.length === 0
  }
}

/**
 * Convierte asientos seleccionados del formato del componente al formato del carrito
 */
export function convertSeatsToCartItems(selectedSeats: any[]): CartItem[] {
  return selectedSeats.map(seat => ({
    id: seat.id,
    type: 'seat' as const,
    zoneName: seat.zoneName,
    price: seat.price,
    rowLetter: seat.rowLetter,
    seatNumber: seat.seatNumber
  }))
}

/**
 * Convierte boletos generales del formato del componente al formato del carrito
 */
export function convertGeneralTicketsToCartItems(generalTickets: any[]): CartItem[] {
  return generalTickets.map(ticket => ({
    id: ticket.id,
    type: 'general' as const,
    zoneName: ticket.zoneName,
    price: ticket.price,
    quantity: ticket.quantity
  }))
}

/**
 * Combina asientos y boletos generales en un solo array de items del carrito
 */
export function combineCartItems(selectedSeats: any[], generalTickets: any[]): CartItem[] {
  const seatItems = convertSeatsToCartItems(selectedSeats)
  const generalItems = convertGeneralTicketsToCartItems(generalTickets)
  return [...seatItems, ...generalItems]
} 