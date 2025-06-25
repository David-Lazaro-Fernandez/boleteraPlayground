"use client";
import { SeatMapCreator } from "@/components/seat-creator/seat-map-creator";

export default function SeatMapCreatorPage() {
  return (
    <div>
      <div className="h-[calc(100vh-4rem)]">
        <SeatMapCreator />
      </div>
    </div>
  );
}
