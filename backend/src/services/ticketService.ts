import * as QRCode from "qrcode";
import * as puppeteer from "puppeteer";
import * as handlebars from "handlebars";
import { db, storage } from "../config/firebaseConfig";
import { EmailService } from "./emailService";
import { 
  TicketData, 
  MovementData, 
  EventInfo, 
  BuyerInfo, 
  CodeGenerationResponse,
  QRCodeData,
  PuppeteerConfig,
  PDFOptions 
} from "../types";

/**
 * Servicio principal para manejo de tickets
 */
export class TicketService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Procesar generación de tickets cuando el pago es confirmado
   */
  public async processTicketGeneration(
    movementId: string,
    movementData: MovementData
  ): Promise<void> {
    try {
      console.log(`Processing ticket generation for movement ${movementId}`);

      // 1. Obtener todos los tickets de la venta
      const tickets: TicketData[] = await this.getTicketsByMovement(movementId);

      // 2. Obtener información del evento si existe event_id
      let eventInfo: EventInfo = {
        nombre: "Evento Principal",
        fecha: new Date().toLocaleDateString("es-ES"),
        hora: "20:00",
        lugar: "Venue Principal",
      };

      if (movementData.event_id) {
        const eventDoc = await db.collection("events").doc(movementData.event_id).get();
        if (eventDoc.exists) {
          const eventData = eventDoc.data();
          eventInfo = {
            nombre: eventData?.nombre || "Evento Principal",
            fecha: eventData?.fecha ?
              eventData.fecha.toDate().toLocaleDateString("es-ES") :
              new Date().toLocaleDateString("es-ES"),
            hora: eventData?.hora || "20:00",
            lugar: eventData?.lugar || "Venue Principal",
          };
        }
      }

      // 3. Generar códigos para cada ticket y agregar info completa
      const ticketsWithCodes = await this.generateCodesForTickets(tickets, movementData, eventInfo, {
        email: movementData.buyer_email || "",
        nombre: movementData.buyer_name || "",
      });

      // 4. Generar PDF
      const pdfBuffer = await this.generateTicketsPDF(ticketsWithCodes);

      // 5. Subir a Storage
      const downloadURL = await this.uploadPDFToStorage(pdfBuffer, movementId);

      // 6. Enviar por email
      await this.sendTicketEmail(movementData, downloadURL, ticketsWithCodes.length);

      console.log(`Ticket processing completed for movement ${movementId}`);
    } catch (error) {
      console.error(`Error processing tickets for movement ${movementId}:`, error);
      throw error;
    }
  }

  /**
   * Generar códigos QR y de barras para un ticket individual
   */
  public async generateTicketCodes(ticketId: string, movementId: string): Promise<CodeGenerationResponse> {
    try {
      // Generar QR Code (contiene información del ticket)
      const qrData: QRCodeData = {
        ticketId,
        movementId,
        timestamp: Date.now(),
        type: "ticket",
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Generar código de barras (texto simple)
      const barcodeData = `${movementId}-${ticketId}`;

      return {
        success: true,
        qrCode: qrCodeDataURL,
        barCode: barcodeData,
      };
    } catch (error) {
      console.error("Error generating codes:", error);
      throw error;
    }
  }

  /**
   * Generar PDF con Puppeteer
   */
  private async generateTicketsPDF(tickets: TicketData[]): Promise<Buffer> {
    let browser: puppeteer.Browser | undefined;
    try {
      const puppeteerConfig: PuppeteerConfig = {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      };

      browser = await puppeteer.launch(puppeteerConfig);
      const page = await browser.newPage();

      // Template HTML para los tickets
      const htmlTemplate = this.getTicketHTMLTemplate();
      const template = handlebars.compile(htmlTemplate);
      const html = template({ tickets });

      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfOptions: PDFOptions = {
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Subir PDF a Firebase Storage
   */
  private async uploadPDFToStorage(pdfBuffer: Buffer, movementId: string): Promise<string> {
    try {
      const bucket = storage.bucket();
      const fileName = `tickets/movement-${movementId}-${Date.now()}.pdf`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: "application/pdf",
        },
      });

      // Generar URL firmada válida por 7 días
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      return signedUrl;
    } catch (error) {
      console.error("Error uploading PDF to storage:", error);
      throw error;
    }
  }

  /**
   * Enviar email con tickets usando EmailService
   */
  private async sendTicketEmail(
    movementData: MovementData,
    pdfUrl: string,
    ticketCount: number
  ): Promise<void> {
    try {
      console.log(`Sending email to ${movementData.buyer_email} with ${ticketCount} tickets`);
      console.log(`PDF URL: ${pdfUrl}`);
      
      // Usar el EmailService real
      await this.emailService.sendTicketEmail(movementData, pdfUrl, ticketCount);
      
      console.log("Email sent successfully using EmailService");
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Obtener tickets por movimiento desde Firestore
   */
  private async getTicketsByMovement(movementId: string): Promise<TicketData[]> {
    // Obtener movement_tickets
    const movementTicketsRef = db.collection("movement_tickets");
    const movementTicketsQuery = movementTicketsRef.where("movimiento_id", "==", movementId);
    const movementTicketsSnapshot = await movementTicketsQuery.get();

    const tickets: TicketData[] = [];

    for (const doc of movementTicketsSnapshot.docs) {
      const movementTicket = doc.data();

      // Obtener el ticket completo
      const ticketDoc = await db.collection("tickets").doc(movementTicket.boleto_id).get();
      if (ticketDoc.exists) {
        const ticketData = ticketDoc.data();
        tickets.push({
          id: ticketDoc.id,
          movementId: movementId,
          zona: ticketData?.zona || "",
          fila: ticketData?.fila || "",
          asiento: ticketData?.asiento || 0,
          precio: movementTicket.precio_vendido,
          qrCode: "", // Se llenará después
          barCode: "", // Se llenará después
          eventInfo: { // Se llenará después
            nombre: "",
            fecha: "",
            hora: "",
            lugar: "",
          },
          buyerInfo: { // Se llenará después
            email: "",
            nombre: "",
          },
        });
      }
    }

    return tickets;
  }

  /**
   * Generar códigos QR y de barras para tickets
   */
  private async generateCodesForTickets(
    tickets: TicketData[],
    movementData: MovementData,
    eventInfo: EventInfo,
    buyerInfo: BuyerInfo
  ): Promise<TicketData[]> {
    const ticketsWithCodes = [];

    for (const ticket of tickets) {
      // Generar QR Code
      const qrData: QRCodeData = {
        ticketId: ticket.id,
        movementId: movementData.id,
        zona: ticket.zona,
        fila: ticket.fila,
        asiento: ticket.asiento,
        timestamp: Date.now(),
        type: "ticket",
      };

      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

      ticketsWithCodes.push({
        ...ticket,
        qrCode,
        barCode: `${movementData.id}-${ticket.id}`,
        eventInfo,
        buyerInfo,
      });
    }

    return ticketsWithCodes;
  }

  /**
   * Template HTML para generar tickets
   */
  private getTicketHTMLTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .ticket { 
            border: 2px dashed #333; 
            margin: 20px 0; 
            padding: 20px; 
            page-break-inside: avoid;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          .ticket-header { text-align: center; margin-bottom: 20px; }
          .ticket-info { display: flex; justify-content: space-between; }
          .codes { text-align: center; margin: 20px 0; }
          .qr-code, .bar-code { margin: 10px; }
          h1 { margin: 0; font-size: 24px; }
          h2 { margin: 0; font-size: 18px; }
          p { margin: 5px 0; }
        </style>
      </head>
      <body>
        ` + `{{#each tickets}}` + `
        <div class="ticket">
          <div class="ticket-header">
            <h1>🎫 BOLETO DE ENTRADA</h1>
            <h2>` + `{{eventInfo.nombre}}` + `</h2>
            <p>` + `{{eventInfo.fecha}}` + ` - ` + `{{eventInfo.hora}}` + `</p>
            <p>` + `{{eventInfo.lugar}}` + `</p>
          </div>
          
          <div class="ticket-info">
            <div>
              <p><strong>Zona:</strong> ` + `{{zona}}` + `</p>
              <p><strong>Fila:</strong> ` + `{{fila}}` + `</p>
              <p><strong>Asiento:</strong> ` + `{{asiento}}` + `</p>
            </div>
            <div>
              <p><strong>Precio:</strong> $` + `{{precio}}` + `</p>
              <p><strong>Ticket ID:</strong> ` + `{{id}}` + `</p>
            </div>
          </div>
          
          <div class="codes">
            <div class="qr-code">
              <img src="` + `{{qrCode}}` + `" alt="QR Code" style="width: 150px; height: 150px;">
              <p>Código QR</p>
            </div>
            <div class="bar-code">
              <p style="font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; border: 2px solid #333; padding: 10px; background: white; color: black; border-radius: 5px;">` + `{{barCode}}` + `</p>
              <p>Código de Barras</p>
            </div>
          </div>
        </div>
        ` + `{{/each}}` + `
      </body>
      </html>
    `;
  }
} 