"use client";

import { useState, useEffect } from "react";
import { EventTable } from "@/components/events/event-table";
import { EventDrawer } from "@/components/events/event-drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CalendarRange } from "lucide-react";
import { getAllVenues, Venue } from "@/lib/firebase/transactions";

interface Filter {
  type: "date" | "venue";
  value: string;
  label: string;
}

export default function EventsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | undefined>();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Filter[]>([
    {
      type: "date",
      value: "30days",
      label: "Próximos 30 días",
    },
  ]);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const venuesList = await getAllVenues();
      setVenues(venuesList);
    } catch (error) {
      console.error("Error loading venues:", error);
    }
  };

  const handleEditEvent = (id: string) => {
    setEditingEventId(id);
    setDrawerOpen(true);
  };

  const handleNewEvent = () => {
    setEditingEventId(undefined);
    setDrawerOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters((filters) =>
      filters.filter(
        (f) =>
          f.type !== filterToRemove.type || f.value !== filterToRemove.value,
      ),
    );
  };

  const addVenueFilter = (venue: Venue) => {
    const newFilter: Filter = {
      type: "venue",
      value: venue.id!,
      label: venue.nombre,
    };

    // Remover cualquier otro filtro de venue existente
    const filtersWithoutVenue = activeFilters.filter((f) => f.type !== "venue");
    setActiveFilters([...filtersWithoutVenue, newFilter]);
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.type}-${filter.value}`}
                variant="outline"
                className="flex items-center gap-1 px-3 py-1 bg-white"
              >
                {filter.type === "date" && (
                  <CalendarRange className="h-3 w-3" />
                )}
                <span>{filter.label}</span>
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => removeFilter(filter)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={handleNewEvent}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="listado" className="mb-6">
        <TabsList className="bg-white">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-gray-100"
          >
            Listado
          </TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="space-y-6">
          <EventTable
            key={refreshKey}
            onEdit={handleEditEvent}
            venueFilter={activeFilters.find((f) => f.type === "venue")?.value}
          />
        </TabsContent>

        <TabsContent value="plantillas">
          <div className="rounded-md border bg-white p-8 text-center text-gray-500">
            Aquí podrás configurar plantillas para eventos recurrentes.
          </div>
        </TabsContent>

        <TabsContent value="historial">
          <div className="rounded-md border bg-white p-8 text-center text-gray-500">
            Aquí encontrarás los eventos finalizados o archivados.
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Drawer */}
      <EventDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        eventId={editingEventId}
        venues={venues}
        onSuccess={handleRefresh}
      />
    </>
  );
}
