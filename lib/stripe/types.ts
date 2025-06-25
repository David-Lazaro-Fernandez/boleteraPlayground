export interface CartItem {
  id: string;
  type: "seat" | "general";
  zoneName: string;
  price: number;
  // Para asientos numerados
  rowLetter?: string;
  seatNumber?: number;
  // Para boletos generales
  quantity?: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  totalItems: number;
  isEmpty: boolean;
}

export interface EventInfo {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  image?: string;
}

export interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PaymentMethod {
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  paymentStatus?: string;
  paymentIntentId?: string;
  metadata?: Record<string, string>;
  customerDetails?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
  };
  amountTotal?: number | null;
  currency?: string;
  paymentMethod?: PaymentMethod | null;
  error?: string;
}
