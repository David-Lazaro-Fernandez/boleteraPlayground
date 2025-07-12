"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTicketsByMovement } from "@/lib/firebase/transactions";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Ticket {
  id: string;
  fila: string;
  asiento: number;
  zona: string;
}

export default function TicketSearchView() {
  const [movementId, setMovementId] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!movementId.trim()) {
      setError("Por favor ingresa un ID de movimiento");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const movementTickets = await getTicketsByMovement(movementId);
      
      // Obtener los tickets completos basados en los IDs
      const ticketsData = await Promise.all(
        movementTickets.map(async (mt) => {
          const ticketRef = doc(db, "tickets", mt.boleto_id);
          const ticketSnap = await getDoc(ticketRef);
          if (ticketSnap.exists()) {
            return {
              id: ticketSnap.id,
              ...ticketSnap.data()
            } as Ticket;
          }
          return null;
        })
      );

      // Filtrar los tickets nulos y actualizar el estado
      const validTickets = ticketsData.filter((t): t is Ticket => t !== null);
      setTickets(validTickets);
    } catch (err) {
      setError("Error al buscar los boletos. Por favor verifica el ID e intenta de nuevo.");
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Búsqueda de Boletos</CardTitle>
        <CardDescription>
          Ingresa el ID del movimiento para ver los boletos asociados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Ingresa el ID del movimiento..."
            value={movementId}
            onChange={(e) => setMovementId(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>

        {error && (
          <div className="text-red-500 mb-4 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">Buscando boletos...</div>
        ) : tickets.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID del Boleto</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Fila</TableHead>
                  <TableHead>Asiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      {ticket.id}
                    </TableCell>
                    <TableCell>{ticket.zona}</TableCell>
                    <TableCell>{ticket.fila}</TableCell>
                    <TableCell>{ticket.asiento}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : movementId && !isLoading ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron boletos para este movimiento
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
} 