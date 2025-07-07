import * as QRCode from "qrcode";
import * as puppeteer from "puppeteer";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";
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
        nombre: "ACORDEONAZO",
        fecha: "Viernes 18 de Julio del 2025",
        hora: "20:00 hrs.",
        lugar: "CENTRO DE ESPECTACULOS CD. VICTORIA",
      };

      if (movementData.event_id) {
        const eventDoc = await db.collection("events").doc(movementData.event_id).get();
        if (eventDoc.exists) {
          const eventData = eventDoc.data();
          eventInfo = {
            nombre: "ACORDEONAZO",
            fecha: "Viernes 18 de Julio del 2025",
            hora: "20:00 hrs.",
            lugar: "CENTRO DE ESPECTACULOS CD. VICTORIA",
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
    let page: puppeteer.Page | undefined;
    try {
      const puppeteerConfig: puppeteer.LaunchOptions = {
        headless: true, // Usar headless estándar para máxima compatibilidad
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        timeout: 30000, // 30 segundos timeout
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-features=TranslateUI",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-sync",
          "--disable-translate",
          "--disable-ipc-flooding-protection",
          "--disable-default-apps",
          "--disable-background-networking",
          "--disable-component-update",
          "--disable-client-side-phishing-detection",
          "--disable-hang-monitor",
          "--disable-popup-blocking",
          "--disable-prompt-on-repost",
          "--disable-domain-reliability",
          "--disable-features=AudioServiceOutOfProcess",
          "--disable-features=VizDisplayCompositor",
          "--run-all-compositor-stages-before-draw",
          "--disable-threaded-animation",
          "--disable-threaded-scrolling",
          "--disable-checker-imaging",
          "--disable-image-animation-resync",
          "--disable-partial-raster",
          "--disable-skia-runtime-opts",
          "--disable-system-font-check",
          "--disable-features=BlinkGenPropertyTrees",
          "--memory-pressure-off",
          "--max_old_space_size=4096",
          "--disable-feature=VizDisplayCompositor",
          "--disable-features=AudioServiceOutOfProcess",
          "--disable-features=VizDisplayCompositor",
          "--force-color-profile=srgb",
          "--disable-background-mode",
          "--disable-renderer-accessibility",
          "--disable-permissions-api",
          "--disable-speech-api",
        ],
      };

      console.log("Launching browser with config...");
      browser = await puppeteer.launch(puppeteerConfig);
      
      // Verificar que el browser esté conectado
      if (!browser.isConnected()) {
        throw new Error("Browser failed to connect");
      }
      
      console.log("Creating new page...");
      page = await browser.newPage();
      
      // Dar tiempo para que la página se estabilice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configurar viewport con manejo de errores robusto
      try {
        console.log("Setting viewport...");
        await page.setViewport({
          width: 1100,
          height: 350,
          deviceScaleFactor: 1
        });
        console.log("Viewport set successfully");
      } catch (viewportError) {
        console.warn("Failed to set viewport, continuing without it:", viewportError);
        // Continuar sin viewport si falla
      }

      // Template HTML para los tickets
      console.log("Generating HTML template...");
      const htmlTemplate = this.getTicketHTMLTemplate();
      const template = handlebars.compile(htmlTemplate);
      const html = template({ tickets });

      console.log("Setting page content...");
      await page.setContent(html, { 
        waitUntil: "networkidle0",
        timeout: 30000 
      });

      console.log("Generating PDF...");
      const pdfOptions = {
        width: '1100px',
        height: '350px',
        printBackground: true,
        margin: {
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px'
        },
        timeout: 30000
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      console.log("PDF generated successfully");
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
      } catch (pageCloseError) {
        console.warn("Error closing page:", pageCloseError);
      }
      
      try {
        if (browser && browser.isConnected()) {
          await browser.close();
        }
      } catch (browserCloseError) {
        console.warn("Error closing browser:", browserCloseError);
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
          asiento: ticketData?.asiento || "",
          precio: movementTicket.precio_vendido,
          qrCode: "", // Se llenará después
          barCode: "", // Se llenará después
          displayOrderNumber: "", // Se llenará después
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
      const fullBarCode = `${movementData.id}-${ticket.id}`;
      
      // Crear versión truncada para mostrar (solo primeros 6 caracteres)
      const displayOrderNumber = fullBarCode.substring(0, 6);

      ticketsWithCodes.push({
        ...ticket,
        qrCode,
        barCode: fullBarCode,
        displayOrderNumber,
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
    try {
      // Leer el archivo template desde el directorio templates
      const templatePath = path.join(__dirname, '../templates/ticketTemplate.html');
      let templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Convertir el template estático a un template dinámico de Handlebars
      templateContent = this.convertToHandlebarsTemplate(templateContent);
      
      return templateContent;
    } catch (error) {
      console.error('Error reading ticket template:', error);
      // Fallback al template básico si hay error
      return this.getBasicTicketTemplate();
    }
  }

  /**
   * Cargar configuración de assets desde Firebase Storage
   */
  private loadAssetsConfig(): { fonts: Record<string, string>; images: Record<string, string> } {
    try {
      const configPath = path.join(__dirname, '../config/assets.json');
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      }
    } catch (error) {
      console.warn('Error loading assets config:', error);
    }
    
    // Fallback a configuración vacía
    return {
      fonts: {},
      images: {}
    };
  }

  /**
   * Convierte el template estático a un template dinámico de Handlebars
   */
  private convertToHandlebarsTemplate(templateContent: string): string {
    // Cargar configuración de assets desde Firebase Storage
    const assetsConfig = this.loadAssetsConfig();
    
    // Reemplazar rutas de imágenes con URLs de Firebase Storage
    if (assetsConfig.images) {
      templateContent = templateContent.replace(/src="..\/..\/..\/public\/Star_Morado\.svg"/g, 
        `src="${assetsConfig.images.Star_Morado}"`);
      templateContent = templateContent.replace(/src="..\/..\/..\/public\/Logo_Morado\.svg"/g, 
        `src="${assetsConfig.images.Logo_Morado}"`);
      templateContent = templateContent.replace(/src="..\/..\/..\/public\/Facebook\.svg"/g, 
        `src="${assetsConfig.images.Facebook}"`);
      templateContent = templateContent.replace(/src="..\/..\/..\/public\/Instagram\.svg"/g, 
        `src="${assetsConfig.images.Instagram}"`);
      templateContent = templateContent.replace(/src="..\/..\/..\/public\/Tiktok\.svg"/g, 
        `src="${assetsConfig.images.Tiktok}"`);
    }
    
    // Reemplazar rutas de fuentes con URLs de Firebase Storage
    if (assetsConfig.fonts) {
      templateContent = templateContent.replace(/url\('..\/..\/..\/fonts\/Gontserrat-Regular\.ttf'\)/g, 
        `url('${assetsConfig.fonts['Gontserrat-Regular']}')`);
      templateContent = templateContent.replace(/url\('..\/..\/..\/fonts\/Gontserrat-Medium\.ttf'\)/g, 
        `url('${assetsConfig.fonts['Gontserrat-Medium']}')`);
      templateContent = templateContent.replace(/url\('..\/..\/..\/fonts\/Dazzle_Unicase_Bold\.otf'\)/g, 
        `url('${assetsConfig.fonts['Dazzle_Unicase_Bold']}')`);
    }
    
    // Envolver todo en un loop de Handlebars para cada ticket
    const bodyContent = templateContent.replace(/<body[^>]*>([\s\S]*?)<\/body>/i, (match, content) => {
      return `<body class="bg-gray-100 p-8">
        {{#each tickets}}
        ${content}
        {{/each}}
      </body>`;
    });
    
    // Reemplazar placeholders con variables dinámicas de Handlebars
    let dynamicContent = bodyContent;
    
    // Reemplazar placeholders específicos
    dynamicContent = dynamicContent.replace(/<!-- EVENT_NAME_PLACEHOLDER -->/g, '{{eventInfo.nombre}}');
    dynamicContent = dynamicContent.replace(/<!-- VENUE_NAME_PLACEHOLDER -->/g, '{{eventInfo.lugar}}');
    dynamicContent = dynamicContent.replace(/<!-- CITY_PLACEHOLDER -->/g, 'Cd. Victoria, Tamps');
    dynamicContent = dynamicContent.replace(/<!-- DATE_PLACEHOLDER -->/g, '{{eventInfo.fecha}}');
    dynamicContent = dynamicContent.replace(/<!-- TIME_PLACEHOLDER -->/g, '{{eventInfo.hora}}');
    
    // Usar template literal para evitar confusiones del linter
    const priceTemplate = '$ {{precio}}';
    dynamicContent = dynamicContent.replace(/<!-- PRICE_PLACEHOLDER -->/g, priceTemplate);
    
    dynamicContent = dynamicContent.replace(/<!-- ORDER_PLACEHOLDER -->/g, '{{displayOrderNumber}}');
    dynamicContent = dynamicContent.replace(/<!-- TYPE_PLACEHOLDER -->/g, '{{zona}}');
    dynamicContent = dynamicContent.replace(/<!-- SECTION_PLACEHOLDER -->/g, '{{zona}}');
    dynamicContent = dynamicContent.replace(/<!-- SEAT_PLACEHOLDER -->/g, '{{fila}}{{asiento}}');
    
    const qrTemplate = '<img src="{{qrCode}}" alt="Código QR" style="width: 100%; height: 100%; object-fit: contain;">';
    dynamicContent = dynamicContent.replace(/<!-- QR_CODE_PLACEHOLDER -->/g, qrTemplate);
    
    return dynamicContent;
  }

  /**
   * Template básico como fallback
   */
  private getBasicTicketTemplate(): string {
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
        {{#each tickets}}
        <div class="ticket">
          <div class="ticket-header">
            <h1>🎫 BOLETO DE ENTRADA</h1>
            <h2>{{eventInfo.nombre}}</h2>
            <p>{{eventInfo.fecha}} - {{eventInfo.hora}}</p>
            <p>{{eventInfo.lugar}}</p>
          </div>
          
          <div class="ticket-info">
            <div>
              <p><strong>Zona:</strong> {{zona}}</p>
              <p><strong>Fila:</strong> {{fila}}</p>
              <p><strong>Asiento:</strong> {{asiento}}</p>
            </div>
            <div>
              <p><strong>Precio:</strong> {{precio}}</p>
              <p><strong>Ticket ID:</strong> {{id}}</p>
            </div>
          </div>
          
          <div class="codes">
            <div class="qr-code">
              <img src="{{qrCode}}" alt="QR Code" style="width: 150px; height: 150px;">
              <p>Código QR</p>
            </div>
            <div class="bar-code">
              <p style="font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; border: 2px solid #333; padding: 10px; background: white; color: black; border-radius: 5px;">{{displayOrderNumber}}</p>
              <p>Código de Barras</p>
            </div>
          </div>
        </div>
        {{/each}}
      </body>
      </html>
    `;
  }
} 