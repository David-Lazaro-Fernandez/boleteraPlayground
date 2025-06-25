import { useState, useCallback, useMemo } from "react";
import { CartItem, CartSummary, EventInfo } from "@/lib/stripe/types";
import { calculateCartSummary } from "@/lib/stripe/cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

  // Calcular resumen del carrito automáticamente
  const cartSummary: CartSummary = useMemo(() => {
    return calculateCartSummary(items);
  }, [items]);

  // Agregar item al carrito
  const addItem = useCallback((item: CartItem) => {
    setItems((currentItems) => {
      // Verificar si el item ya existe
      const existingItemIndex = currentItems.findIndex(
        (existingItem) => existingItem.id === item.id,
      );

      if (existingItemIndex >= 0) {
        // Si existe y es un boleto general, incrementar cantidad
        if (item.type === "general") {
          const newItems = [...currentItems];
          const existingItem = newItems[existingItemIndex];
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: (existingItem.quantity || 1) + (item.quantity || 1),
          };
          return newItems;
        }
        // Si es un asiento, no hacer nada (ya está seleccionado)
        return currentItems;
      }

      // Agregar nuevo item
      return [...currentItems, item];
    });
  }, []);

  // Remover item del carrito
  const removeItem = useCallback((itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  }, []);

  // Actualizar cantidad de un boleto general
  const updateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems((currentItems) => {
        return currentItems.map((item) => {
          if (item.id === itemId && item.type === "general") {
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      });
    },
    [removeItem],
  );

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Establecer información del evento
  const setEvent = useCallback((event: EventInfo) => {
    setEventInfo(event);
  }, []);

  // Cargar items desde datos existentes (para compatibilidad con el sistema actual)
  const loadFromExistingData = useCallback(
    (selectedSeats: any[], generalTickets: any[]) => {
      const newItems: CartItem[] = [];

      // Convertir asientos seleccionados
      selectedSeats.forEach((seat) => {
        newItems.push({
          id: seat.id,
          type: "seat",
          zoneName: seat.zoneName,
          price: seat.price,
          rowLetter: seat.rowLetter,
          seatNumber: seat.seatNumber,
        });
      });

      // Convertir boletos generales
      generalTickets.forEach((ticket) => {
        newItems.push({
          id: ticket.id,
          type: "general",
          zoneName: ticket.zoneName,
          price: ticket.price,
          quantity: ticket.quantity,
        });
      });

      setItems(newItems);
    },
    [],
  );

  return {
    items,
    cartSummary,
    eventInfo,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setEvent,
    loadFromExistingData,
    isEmpty: items.length === 0,
  };
}
