/**
 * Timestamp placeholder hasta instalar Firebase Admin SDK
 */
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

/**
 * Datos de un ticket individual
 */
export interface TicketData {
  id: string;
  movementId: string;
  zona: string;
  fila: string;
  asiento: string;
  precio: number;
  qrCode: string;
  barCode: string;
  displayOrderNumber: string;
  eventInfo: EventInfo;
  buyerInfo: BuyerInfo;
}

/**
 * Información del evento
 */
export interface EventInfo {
  nombre: string;
  fecha: string;
  hora: string;
  lugar: string;
}

/**
 * Información del comprador
 */
export interface BuyerInfo {
  email: string;
  nombre?: string;
}

/**
 * Datos del movimiento/venta
 */
export interface MovementData {
  id: string;
  total: number;
  subtotal: number;
  cargo_servicio: number;
  tipo_pago: string;
  fecha: FirebaseTimestamp;
  status?: "pending" | "paid" | "cancelled";
  buyer_email?: string;
  buyer_name?: string;
  event_id?: string;
}

/**
 * Respuesta de generación de códigos
 */
export interface CodeGenerationResponse {
  success: boolean;
  qrCode: string;
  barCode: string;
}

/**
 * Datos para generar códigos QR
 */
export interface QRCodeData {
  ticketId: string;
  movementId: string;
  zona?: string;
  fila?: string;
  asiento?: string;
  timestamp: number;
  type: "ticket";
}

/**
 * Configuración de email
 */
export interface EmailConfig {
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Archivos adjuntos de email
 */
export interface EmailAttachment {
  filename: string;
  type: string;
  disposition: string;
  content_id: string;
  content: string;
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Request para generar tickets
 */
export interface GenerateTicketsRequest {
  movementId: string;
}

/**
 * Request para procesar pago
 */
export interface ProcessPaymentRequest {
  movementId: string;
  status: "paid" | "cancelled";
}

/**
 * Configuración de Puppeteer
 */
export interface PuppeteerConfig {
  headless: boolean | "shell";
  args: string[];
  executablePath?: string;
  timeout?: number;
}

/**
 * Opciones para generar PDF
 */
export interface PDFOptions {
  format: "A4" | "Letter";
  printBackground: boolean;
  margin: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
} 