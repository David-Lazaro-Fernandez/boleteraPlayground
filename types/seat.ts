export interface CreatedSeat {
  id: string;
  x: number;
  y: number;
  zone: string;
  zoneName: string;
  color: string;
  price: number;
  status: string;
  rowLetter: string;
  seatNumber: number;
  lineId?: string;
  lineIndex?: number;
}
