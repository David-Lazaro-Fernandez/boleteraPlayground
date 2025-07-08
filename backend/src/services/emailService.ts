import * as nodemailer from "nodemailer";
import { MovementData, EmailConfig, EmailAttachment } from "@/types";
import dotenv from "dotenv";

dotenv.config();

/**
 * Servicio de email usando node-mailer con SMTP
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  

  constructor() {
    // Configurar SMTP
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables");
    }


    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.fromEmail = process.env.FROM_EMAIL || "noreply@boletera.com";
  }

  /**
   * Enviar email con tickets adjuntos
   */
  public async sendTicketEmail(
    movementData: MovementData,
    pdfUrl: string,
    ticketCount: number
  ): Promise<void> {
    try {
      if (!movementData.buyer_email) {
        throw new Error("No buyer email found for movement");
      }

      // Descargar el PDF para adjuntarlo
      const pdfResponse = await fetch(pdfUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();

      const mailOptions = {
        from: this.fromEmail,
        to: movementData.buyer_email,
        subject: "Tus boletos han sido confirmados",
        html: this.getEmailTemplate(movementData, ticketCount, pdfUrl),
        attachments: [
          {
            filename: `boletos-${movementData.id}.pdf`,
            content: Buffer.from(pdfBuffer),
            contentType: "application/pdf",
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${movementData.buyer_email}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Enviar email de confirmación de pago
   */
  public async sendPaymentConfirmationEmail(
    email: string,
    movementData: MovementData
  ): Promise<void> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: "Pago confirmado - Procesando tus boletos",
        html: this.getPaymentConfirmationTemplate(movementData),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Payment confirmation email sent to ${email}`);
    } catch (error) {
      console.error("Error sending payment confirmation email:", error);
      throw error;
    }
  }

  /**
   * Template HTML para email de tickets
   */
  private getEmailTemplate(
    movementData: MovementData,
    ticketCount: number,
    pdfUrl: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">¡Tus boletos están listos!</h1>
        
        <p>Hola ${movementData.buyer_name || "Usuario"},</p>
        
        <p>Tu compra ha sido confirmada exitosamente. Aquí tienes los detalles:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Detalles de la compra:</h3>
          <p><strong>ID de compra:</strong> ${movementData.id}</p>
          <p><strong>Número de boletos:</strong> ${ticketCount}</p>
          <p><strong>Total pagado:</strong> $${movementData.total}</p>
          <p><strong>Método de pago:</strong> ${movementData.tipo_pago}</p>
        </div>
        
        <p>Tus boletos están adjuntos en formato PDF. También puedes descargarlos desde el siguiente enlace:</p>
        
        <a href="${pdfUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Descargar Boletos
        </a>
        
        <p><small>Este enlace expira en 7 días por seguridad.</small></p>
        
        <hr style="margin: 30px 0;">
        
        <p><strong>Instrucciones importantes:</strong></p>
        <ul>
          <li>Presenta tus boletos en formato digital o impreso el día del evento</li>
          <li>Cada boleto tiene un código QR único para validación</li>
          <li>Llega con tiempo suficiente para el acceso al evento</li>
        </ul>
        
        <p>¡Esperamos que disfrutes el evento!</p>
        
        <p style="color: #666; font-size: 12px;">
          Este email fue enviado automáticamente. No respondas a este mensaje.
        </p>
        <div style="font-family: Arial, sans-serif; font-size: 11px; color: #666; margin-top: 40px;">
          <hr style="margin: 20px 0;">

          <h4 style="margin-bottom: 10px;">Términos, Condiciones y Disclaimers del Boleto Digital</h4>

          <p><strong>1. Condiciones Generales:</strong> Astral Tickets actúa únicamente como intermediario entre el comprador y los organizadores del evento, por lo cual no es responsable por cancelaciones, modificaciones o incidencias relacionadas directa o indirectamente con la realización del mismo.</p>

          <p><strong>2. Cancelaciones o Cambios:</strong> En caso de cancelación, reprogramación o modificación del evento, Astral Tickets notificará oportunamente al comprador mediante los datos de contacto proporcionados al momento de la compra. Los procesos de reembolso o canje serán determinados exclusivamente por el organizador. Es obligación del comprador seguir las instrucciones proporcionadas para dicho fin.</p>

          <p><strong>3. Responsabilidad del Comprador:</strong> El comprador es responsable de verificar y confirmar los detalles del evento (fecha, hora, ubicación, restricciones de acceso, entre otros) antes de finalizar la compra. Para dudas o aclaraciones relacionadas con el evento, deberá contactar directamente al organizador.</p>

          <p><strong>4. Uso del Boleto Digital:</strong> Este boleto es personal e intransferible, válido para una sola entrada o acceso según lo indicado. El comprador debe presentar el boleto en formato digital legible desde un dispositivo móvil o impreso claramente en papel al momento del acceso al evento. La duplicación, alteración o mal uso del boleto digital invalidará automáticamente el derecho de acceso.</p>

          <p><strong>5. Seguridad y Fraude:</strong> El comprador debe mantener protegido su boleto digital. Astral Tickets no se responsabiliza por pérdidas, robos o uso indebido del boleto por parte de terceros.</p>

          <p><strong>6. Consentimiento:</strong> Al adquirir este boleto, el comprador acepta expresamente todos los términos, condiciones y disclaimers aquí establecidos.</p>

          <p><strong>Disclaimers adicionales:</strong></p>
          <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
            <li>Se prohíbe estrictamente el ingreso con objetos peligrosos, armas, drogas o sustancias ilícitas.</li>
            <li>El evento podría ser fotografiado o filmado para fines promocionales; al asistir, acepta tácitamente ser captado en estos materiales y renuncia a cualquier reclamo relacionado con el uso de su imagen.</li>
            <li>La reventa de boletos está estrictamente prohibida.</li>
            <li>Evite publicar fotografías o capturas del boleto en redes sociales o medios públicos, ya que podrían facilitar el fraude y la duplicación del boleto.</li>
          </ul>

          <p><strong>Dudas o aclaraciones:</strong> info@astraltickets.com</p>
          <p><strong>¿Quieres organizar un evento?</strong> contacto@astraltickets.com</p>
        </div>
      </div>
    `;
  }

  /**
   * Template HTML para confirmación de pago
   */
  private getPaymentConfirmationTemplate(movementData: MovementData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">¡Pago confirmado!</h1>
        
        <p>Hola ${movementData.buyer_name || "Usuario"},</p>
        
        <p>Hemos recibido tu pago exitosamente y estamos procesando tus boletos.</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #155724; margin: 0 0 10px 0;">Detalles del pago:</h3>
          <p style="margin: 5px 0;"><strong>ID de compra:</strong> ${movementData.id}</p>
          <p style="margin: 5px 0;"><strong>Monto:</strong> $${movementData.total}</p>
          <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${movementData.tipo_pago}</p>
          <p style="margin: 5px 0;"><strong>Estado:</strong> Confirmado</p>
        </div>
        
        <p><strong>¿Qué sigue?</strong></p>
        <ul>
          <li>Generaremos tus boletos automáticamente</li>
          <li>Recibirás otro email con los boletos en formato PDF</li>
          <li>Este proceso puede tomar hasta 5 minutos</li>
        </ul>
        
        <p>Gracias por tu compra. Te contactaremos pronto con tus boletos.</p>
        
        <p style="color: #666; font-size: 12px;">
          Este email fue enviado automáticamente. No respondas a este mensaje.
        </p>
      </div>
    `;
  }

  /**
   * Verificar la conexión SMTP
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("SMTP connection verified successfully");
      return true;
    } catch (error) {
      console.error("SMTP connection verification failed:", error);
      return false;
    }
  }
} 