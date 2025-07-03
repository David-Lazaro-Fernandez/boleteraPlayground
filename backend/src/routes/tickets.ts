import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { TicketService } from "../services/ticketService";
import { EmailService } from "../services/emailService";
import { db } from "../config/firebaseConfig";
import { 
  ApiResponse, 
  ProcessPaymentRequest, 
  GenerateTicketsRequest,
  MovementData 
} from "../types";

const router = Router();
const ticketService = new TicketService();
const emailService = new EmailService();

/**
 * POST /api/tickets/process-payment
 * Procesar pago y generar tickets automáticamente
 */
router.post(
  "/process-payment",
  [
    body("movementId").notEmpty().withMessage("Movement ID is required"),
    body("status").isIn(["paid", "cancelled"]).withMessage("Status must be paid or cancelled"),
  ],
  async (req: Request<{}, ApiResponse, ProcessPaymentRequest>, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          error: errors.array().map(err => err.msg).join(", "),
        });
      }

      const { movementId, status } = req.body;

      // Obtener el movimiento de Firestore
      const movementDoc = await db.collection("movements").doc(movementId).get();
      if (!movementDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Movement not found",
        });
      }

      const movementData = { id: movementDoc.id, ...movementDoc.data() } as MovementData;

      // Actualizar el status del movimiento
      await db.collection("movements").doc(movementId).update({ status });

      if (status === "paid") {
        // Enviar email de confirmación de pago
        if (movementData.buyer_email) {
          await emailService.sendPaymentConfirmationEmail(movementData.buyer_email, movementData);
        }

        // Procesar tickets en background
        ticketService.processTicketGeneration(movementId, movementData)
          .catch(error => {
            console.error("Error processing tickets in background:", error);
          });

        return res.json({
          success: true,
          message: "Payment processed successfully. Tickets are being generated.",
          data: { movementId, status },
        });
      } else {
        return res.json({
          success: true,
          message: "Payment cancelled successfully.",
          data: { movementId, status },
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/tickets/generate
 * Generar tickets manualmente (endpoint alternativo)
 */
router.post(
  "/generate",
  [
    body("movementId").notEmpty().withMessage("Movement ID is required"),
  ],
  async (req: Request<{}, ApiResponse, GenerateTicketsRequest>, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          error: errors.array().map(err => err.msg).join(", "),
        });
      }

      const { movementId } = req.body;

      // Obtener el movimiento de Firestore
      const movementDoc = await db.collection("movements").doc(movementId).get();
      if (!movementDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Movement not found",
        });
      }

      const movementData = { id: movementDoc.id, ...movementDoc.data() } as MovementData;

      // Procesar tickets
      await ticketService.processTicketGeneration(movementId, movementData);

      return res.json({
        success: true,
        message: "Tickets generated successfully",
        data: { movementId },
      });
    } catch (error) {
      console.error("Error generating tickets:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/tickets/generate-codes
 * Generar códigos QR y de barras para un ticket específico
 */
router.post(
  "/generate-codes",
  [
    body("ticketId").notEmpty().withMessage("Ticket ID is required"),
    body("movementId").notEmpty().withMessage("Movement ID is required"),
  ],
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          error: errors.array().map(err => err.msg).join(", "),
        });
      }

      const { ticketId, movementId } = req.body;

      const codes = await ticketService.generateTicketCodes(ticketId, movementId);

      return res.json({
        success: true,
        message: "Codes generated successfully",
        data: codes,
      });
    } catch (error) {
      console.error("Error generating codes:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/tickets/movement/:movementId
 * Obtener información de tickets por movimiento
 */
router.get(
  "/movement/:movementId",
  [
    param("movementId").notEmpty().withMessage("Movement ID is required"),
  ],
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          error: errors.array().map(err => err.msg).join(", "),
        });
      }

      const { movementId } = req.params;

      // Obtener movement_tickets
      const movementTicketsRef = db.collection("movement_tickets");
      const movementTicketsQuery = movementTicketsRef.where("movimiento_id", "==", movementId);
      const movementTicketsSnapshot = await movementTicketsQuery.get();

      const tickets = [];
      for (const doc of movementTicketsSnapshot.docs) {
        const movementTicket = doc.data();
        const ticketDoc = await db.collection("tickets").doc(movementTicket.boleto_id).get();
        
        if (ticketDoc.exists) {
          tickets.push({
            id: ticketDoc.id,
            movementId,
            ...ticketDoc.data(),
            precio_vendido: movementTicket.precio_vendido,
          });
        }
      }

      return res.json({
        success: true,
        message: "Tickets retrieved successfully",
        data: { movementId, tickets, count: tickets.length },
      });
    } catch (error) {
      console.error("Error retrieving tickets:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/tickets/validate/:ticketId
 * Validar un ticket mediante QR Code
 */
router.get(
  "/validate/:ticketId",
  [
    param("ticketId").notEmpty().withMessage("Ticket ID is required"),
  ],
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          error: errors.array().map(err => err.msg).join(", "),
        });
      }

      const { ticketId } = req.params;

      // Verificar si el ticket existe
      const ticketDoc = await db.collection("tickets").doc(ticketId!).get();
      if (!ticketDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      const ticketData = ticketDoc.data();

      // Aquí podrías agregar lógica adicional de validación
      // Por ejemplo, verificar si el ticket ya fue usado, si está dentro del horario del evento, etc.

      return res.json({
        success: true,
        message: "Ticket is valid",
        data: {
          ticketId,
          zona: ticketData?.zona,
          fila: ticketData?.fila,
          asiento: ticketData?.asiento,
          valid: true,
        },
      });
    } catch (error) {
      console.error("Error validating ticket:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router; 