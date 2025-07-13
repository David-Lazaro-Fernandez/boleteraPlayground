"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Search, AlertCircle, Edit2 } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { 
  getCurrentSeatsConfig, 
  updateSeatsStatus,
  validateSeatsAvailability 
} from "@/lib/firebase/seat-management";

interface SeatInfo {
  id: string;
  zone: string;
  zoneName: string;
  rowLetter: string;
  seatNumber: number;
  status: string;
  price: number;
  color: string;
}

const ZONES = [
  { id: "VIP 1", name: "VIP 1" },
  { id: "VIP 2", name: "VIP 2" },
  { id: "VIP 3", name: "VIP 3" },
  { id: "VIP 4", name: "VIP 4" },
  { id: "Oro 1", name: "Oro 1" },
  { id: "Oro 2", name: "Oro 2" },
  { id: "Oro 3", name: "Oro 3" },
  { id: "Oro 4", name: "Oro 4" },
  { id: "Oro 5", name: "Oro 5" },
  { id: "Oro 6", name: "Oro 6" },
  { id: "Oro 7", name: "Oro 7" },
  { id: "Oro 8", name: "Oro 8" },
  { id: "General", name: "General" },
];

export default function SeatManagementView() {
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableRows, setAvailableRows] = useState<string[]>([]);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState<string>("");

  // Cargar filas disponibles cuando se selecciona una zona
  useEffect(() => {
    if (selectedZone) {
      loadAvailableRows();
    } else {
      setAvailableRows([]);
      setSelectedRow("");
    }
  }, [selectedZone]);

  // Cargar asientos disponibles cuando se selecciona una fila
  useEffect(() => {
    if (selectedZone && selectedRow) {
      loadAvailableSeats();
    } else {
      setAvailableSeats([]);
      setSelectedSeat("");
    }
  }, [selectedZone, selectedRow]);

  const loadAvailableRows = async () => {
    try {
      const configResult = await getCurrentSeatsConfig();
      if (configResult.success && configResult.data) {
        const rows = configResult.data.createdSeats
          .filter(seat => seat.zone === selectedZone)
          .map(seat => seat.rowLetter)
          .filter((row, index, self) => self.indexOf(row) === index)
          .sort();
        setAvailableRows(rows);
      }
    } catch (error) {
      console.error("Error loading rows:", error);
    }
  };

  const loadAvailableSeats = async () => {
    try {
      const configResult = await getCurrentSeatsConfig();
      if (configResult.success && configResult.data) {
        const seats = configResult.data.createdSeats
          .filter(seat => seat.zone === selectedZone && seat.rowLetter === selectedRow)
          .map(seat => seat.seatNumber)
          .sort((a, b) => a - b);
        setAvailableSeats(seats);
      }
    } catch (error) {
      console.error("Error loading seats:", error);
    }
  };

  const searchSeat = async () => {
    if (!selectedZone || !selectedRow || !selectedSeat) {
      toast({
        title: "Información incompleta",
        description: "Por favor selecciona zona, fila y asiento",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const configResult = await getCurrentSeatsConfig();
      if (configResult.success && configResult.data) {
        const foundSeat = configResult.data.createdSeats.find(
          seat => 
            seat.zone === selectedZone && 
            seat.rowLetter === selectedRow && 
            seat.seatNumber === parseInt(selectedSeat)
        );

        if (foundSeat) {
          setSeatInfo({
            id: foundSeat.id,
            zone: foundSeat.zone,
            zoneName: foundSeat.zoneName,
            rowLetter: foundSeat.rowLetter,
            seatNumber: foundSeat.seatNumber,
            status: foundSeat.status,
            price: foundSeat.price,
            color: foundSeat.color,
          });
          // Limpiar estado de edición de precio
          setIsEditingPrice(false);
          setEditedPrice("");
        } else {
          toast({
            title: "Asiento no encontrado",
            description: "No se encontró el asiento especificado",
            variant: "destructive",
          });
          setSeatInfo(null);
          setIsEditingPrice(false);
          setEditedPrice("");
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración de asientos",
          variant: "destructive",
        });
        setSeatInfo(null);
        setIsEditingPrice(false);
        setEditedPrice("");
      }
    } catch (error) {
      console.error("Error searching seat:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar el asiento",
        variant: "destructive",
      });
      setSeatInfo(null);
      setIsEditingPrice(false);
      setEditedPrice("");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSeatStatus = async (newStatus: 'available' | 'occupied') => {
    if (!seatInfo) return;

    setIsUpdating(true);
    try {
      const result = await updateSeatsStatus([{
        id: seatInfo.id,
        status: newStatus
      }]);

      if (result.success) {
        setSeatInfo({
          ...seatInfo,
          status: newStatus
        });
        
        toast({
          title: "Éxito",
          description: `Asiento ${newStatus === 'available' ? 'liberado' : 'ocupado'} correctamente`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el asiento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating seat:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el asiento",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSeatPrice = async (newPrice: number) => {
    if (!seatInfo) return;

    setIsUpdating(true);
    try {
      // Obtener la configuración actual
      const configResult = await getCurrentSeatsConfig();
      if (!configResult.success || !configResult.data) {
        throw new Error("No se pudo obtener la configuración actual");
      }

      // Actualizar el precio del asiento específico
      const updatedSeats = configResult.data.createdSeats.map(seat => {
        if (seat.id === seatInfo.id) {
          return { ...seat, price: newPrice };
        }
        return seat;
      });

      // Crear la configuración actualizada
      const updatedConfig = {
        ...configResult.data,
        createdSeats: updatedSeats,
        exportDate: new Date().toISOString()
      };

      // Subir la configuración actualizada
      const { ref, uploadString } = await import("firebase/storage");
      const { storage } = await import("@/lib/firebase/config");
      
      const fileRef = ref(storage, "Seats_data_last_actualizado.json");
      const jsonString = JSON.stringify(updatedConfig, null, 2);
      
      await uploadString(fileRef, jsonString, "raw", {
        contentType: "application/json",
      });

      // Actualizar el estado local
      setSeatInfo({
        ...seatInfo,
        price: newPrice
      });

      setIsEditingPrice(false);
      setEditedPrice("");
      
      toast({
        title: "Éxito",
        description: "Precio actualizado correctamente",
      });
    } catch (error) {
      console.error("Error updating seat price:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el precio",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditingPrice = () => {
    if (seatInfo) {
      setEditedPrice(seatInfo.price.toString());
      setIsEditingPrice(true);
    }
  };

  const cancelEditingPrice = () => {
    setIsEditingPrice(false);
    setEditedPrice("");
  };

  const savePrice = () => {
    const newPrice = parseFloat(editedPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un precio válido (mayor o igual a 0)",
        variant: "destructive",
      });
      return;
    }
    
    // Redondear a 2 decimales
    const roundedPrice = Math.round(newPrice * 100) / 100;
    updateSeatPrice(roundedPrice);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="text-green-600 border-green-600">Disponible</Badge>;
      case 'occupied':
        return <Badge variant="outline" className="text-red-600 border-red-600">Ocupado</Badge>;
      case 'sold':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Vendido</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Reservado</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-600">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Gestión de Asientos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Zona */}
            <div className="space-y-2">
              <Label htmlFor="zone">Zona</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Fila */}
            <div className="space-y-2">
              <Label htmlFor="row">Fila</Label>
              <Select 
                value={selectedRow} 
                onValueChange={setSelectedRow}
                disabled={!selectedZone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fila" />
                </SelectTrigger>
                <SelectContent>
                  {availableRows.map((row) => (
                    <SelectItem key={row} value={row}>
                      {row}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Asiento */}
            <div className="space-y-2">
              <Label htmlFor="seat">Asiento</Label>
              <Select 
                value={selectedSeat} 
                onValueChange={setSelectedSeat}
                disabled={!selectedRow}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar asiento" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat} value={seat.toString()}>
                      {seat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={searchSeat} 
            disabled={isLoading || !selectedZone || !selectedRow || !selectedSeat}
            className="w-full"
          >
            {isLoading ? "Buscando..." : "Buscar Asiento"}
          </Button>
        </CardContent>
      </Card>

      {/* Información del Asiento */}
      {seatInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Información del Asiento
            </CardTitle>
            <div className="text-sm text-gray-500">
              💡 Los precios son editables para testing - haz clic en el ícono de edición
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Zona:</span>
                  <span className="font-semibold">{seatInfo.zoneName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Fila:</span>
                  <span className="font-semibold">{seatInfo.rowLetter}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Asiento:</span>
                  <span className="font-semibold">{seatInfo.seatNumber}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Estado:</span>
                  {getStatusBadge(seatInfo.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Precio:</span>
                  {isEditingPrice ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-20 h-8 text-sm"
                        min="0"
                        step="0.01"
                      />
                      <Button
                        size="sm"
                        onClick={savePrice}
                        disabled={isUpdating}
                        className="h-8 px-2"
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingPrice}
                        disabled={isUpdating}
                        className="h-8 px-2"
                      >
                        ✗
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatPrice(seatInfo.price)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={startEditingPrice}
                        disabled={isUpdating}
                        className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">ID:</span>
                  <span className="font-mono text-xs text-gray-500">{seatInfo.id}</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Acciones disponibles */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Acciones disponibles:</h4>
              <div className="flex gap-2 flex-wrap">
                {seatInfo.status === 'available' ? (
                  <Button 
                    onClick={() => updateSeatStatus('occupied')}
                    disabled={isUpdating}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {isUpdating ? "Actualizando..." : "Ocupar Asiento"}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => updateSeatStatus('available')}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isUpdating ? "Actualizando..." : "Liberar Asiento"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 