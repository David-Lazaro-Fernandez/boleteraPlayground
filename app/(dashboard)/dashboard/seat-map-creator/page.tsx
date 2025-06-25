"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SeatMapCreator } from "@/components/seat-creator/seat-map-creator"

export default function SeatMapCreatorPage() {
  return (
    <MainLayout activePage="seat-map-creator">
      <div className="h-[calc(100vh-4rem)]">
        <SeatMapCreator />
      </div>
    </MainLayout>
  )
}
