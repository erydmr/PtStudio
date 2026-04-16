"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventInput, DatesSetArg } from "@fullcalendar/core";
import { api } from "@/lib/api";
import type { Appointment, Trainer, Client, ClientPackage } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { AppointmentCreateDialog } from "./create-dialog";
import { AppointmentDetailDialog } from "./detail-dialog";
import { RecurringDialog } from "./recurring-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, Repeat, Filter, X } from "lucide-react";

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const calendarRef = useRef<FullCalendar>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [defaultStart, setDefaultStart] = useState<string>("");
  const [defaultEnd, setDefaultEnd] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  const [filterTrainerId, setFilterTrainerId] = useState<string>("");
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = user?.role === "Admin";
  const isTrainer = user?.role === "Trainer";
  const isClient = user?.role === "Client";

  const fetchAppointments = useCallback(async (from: string, to: string) => {
    try {
      const endpoint = isClient
        ? `/api/appointment/my?from=${from}&to=${to}`
        : `/api/appointment?from=${from}&to=${to}`;
      const data = await api.get<Appointment[]>(endpoint);
      setAppointments(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Randevular yuklenemedi." });
    }
  }, [toast, isClient]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        if (isAdmin || isTrainer) {
          const [t, c, cp] = await Promise.all([
            api.get<Trainer[]>("/api/trainer"),
            api.get<Client[]>("/api/client"),
            api.get<ClientPackage[]>(isAdmin ? "/api/clientpackage" : "/api/clientpackage"),
          ]);
          setTrainers(t);
          setClients(c);
          setClientPackages(cp.filter(p => p.status === "Active"));
        }
      } catch {
        // silently fail meta fetch
      }
    };
    fetchMeta();
  }, [isAdmin, isTrainer]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const from = arg.start.toISOString();
    const to = arg.end.toISOString();
    setDateRange({ from, to });
    fetchAppointments(from, to);
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterTrainerId && a.trainerId !== parseInt(filterTrainerId)) return false;
    if (filterClientId && !a.clients.some((c) => c.clientId === parseInt(filterClientId))) return false;
    return true;
  });

  const events: EventInput[] = filteredAppointments.map((a) => ({
    id: a.id.toString(),
    title: a.isGroup
      ? `[Grup] ${a.trainerFullName} (${a.clients.length}/${a.capacity})`
      : `${a.trainerFullName}${a.clients.length > 0 ? " - " + a.clients[0].clientFullName : ""}`,
    start: a.startTime,
    end: a.endTime,
    backgroundColor: a.trainerColor || "#3b82f6",
    borderColor: a.trainerColor || "#3b82f6",
    extendedProps: { appointment: a },
  }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!isAdmin && !isTrainer) return;
    setDefaultStart(selectInfo.start.toISOString());
    setDefaultEnd(selectInfo.end.toISOString());
    setCreateOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const appt = clickInfo.event.extendedProps.appointment as Appointment;
    setSelectedAppointment(appt);
    setDetailOpen(true);
  };

  const refresh = () => {
    if (dateRange.from && dateRange.to) {
      fetchAppointments(dateRange.from, dateRange.to);
    }
  };

  const clearFilters = () => {
    setFilterTrainerId("");
    setFilterClientId("");
  };

  const hasActiveFilter = filterTrainerId || filterClientId;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Takvim</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
              {hasActiveFilter && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {(filterTrainerId ? 1 : 0) + (filterClientId ? 1 : 0)}
                </span>
              )}
            </Button>
          )}
          {(isAdmin || isTrainer) && (
            <>
              <Button size="sm" onClick={() => { setDefaultStart(""); setDefaultEnd(""); setCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Randevu
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setRecurringOpen(true)}>
                  <Repeat className="mr-2 h-4 w-4" />Tekrarlayan
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {showFilters && isAdmin && (
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 border rounded-lg bg-muted/50">
          <div className="min-w-[180px]">
            <label className="text-xs text-muted-foreground block mb-1">Antrenor</label>
            <Select
              value={filterTrainerId}
              onChange={(e) => setFilterTrainerId(e.target.value)}
            >
              <option value="">Tum Antrenorler</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[180px]">
            <label className="text-xs text-muted-foreground block mb-1">Musteri</label>
            <Select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
            >
              <option value="">Tum Musteriler</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </Select>
          </div>
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />Temizle
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredAppointments.length} / {appointments.length} randevu
          </span>
        </div>
      )}

      <div className="bg-background border rounded-lg p-2 sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="tr"
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          selectable={isAdmin || isTrainer}
          selectMirror={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          events={events}
          datesSet={handleDatesSet}
          height="auto"
          buttonText={{
            today: "Bugun",
            month: "Ay",
            week: "Hafta",
            day: "Gun",
          }}
        />
      </div>

      <AppointmentCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        trainers={trainers}
        clients={clients}
        clientPackages={clientPackages}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        onSuccess={refresh}
      />

      <RecurringDialog
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        trainers={trainers}
        clients={clients}
        clientPackages={clientPackages}
        onSuccess={refresh}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={selectedAppointment}
        onRefresh={refresh}
      />
    </div>
  );
}
