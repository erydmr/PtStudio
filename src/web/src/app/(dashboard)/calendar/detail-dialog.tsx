"use client";

import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onRefresh: () => void;
}

const statusLabel: Record<string, string> = {
  Scheduled: "Planlanmis", Completed: "Tamamlandi", Cancelled: "Iptal", Burned: "Yandi",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Scheduled: "default",
  Completed: "secondary",
  Cancelled: "outline",
  Burned: "destructive",
};

export function AppointmentDetailDialog({ open, onOpenChange, appointment, onRefresh }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "Admin";
  const isTrainer = user?.role === "Trainer";

  if (!appointment) return null;

  const formatTime = (iso: string) => new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const handleDelete = async (deleteAll: boolean) => {
    const msg = deleteAll
      ? "Tum tekrarlayan randevulari iptal etmek istediginize emin misiniz?"
      : "Bu randevuyu iptal etmek istediginize emin misiniz?";
    if (!confirm(msg)) return;

    try {
      await api.delete(`/api/appointment/${appointment.id}?deleteAll=${deleteAll}`);
      toast({ title: "Basarili", description: "Randevu iptal edildi." });
      onOpenChange(false);
      onRefresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Iptal basarisiz." });
    }
  };

  const handleManualCheckIn = async (appointmentClientId: number) => {
    try {
      await api.post(`/api/attendance/manual-checkin/${appointmentClientId}`);
      toast({ title: "Basarili", description: "Check-in yapildi." });
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Check-in basarisiz." });
    }
  };

  const handleCancelClient = async (appointmentClientId: number) => {
    if (!confirm("Bu musterinin dersini iptal etmek istediginize emin misiniz?")) return;

    try {
      const data = await api.post<{ success: boolean; burned: boolean; message: string }>(
        `/api/cancellation/${appointmentClientId}`
      );
      if (data.burned) {
        toast({ variant: "destructive", title: "Gec Iptal", description: data.message });
      } else {
        toast({ title: "Basarili", description: data.message });
      }
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Iptal basarisiz." });
    }
  };

  const handleBurnNoShows = async () => {
    if (!confirm("Gelmeyenlerin dersleri yandi olarak isaretlenecek. Devam etmek istiyor musunuz?")) return;

    try {
      const data = await api.post<{ burnedCount: number; message: string }>("/api/attendance/burn-noshows");
      toast({ title: "Basarili", description: data.message });
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Islem basarisiz." });
    }
  };

  const isPastAppointment = new Date(appointment.endTime) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Randevu Detayi</DialogTitle>
          <DialogDescription>
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Antrenor</span>
            <span className="font-medium">{appointment.trainerFullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durum</span>
            <Badge variant="secondary">{statusLabel[appointment.status] || appointment.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kapasite</span>
            <span>{appointment.clients.length}/{appointment.capacity} {appointment.isGroup ? "(Grup)" : ""}</span>
          </div>
          {appointment.notes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notlar</span>
              <span>{appointment.notes}</span>
            </div>
          )}

          {appointment.clients.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Musteriler</p>
              <div className="space-y-2">
                {appointment.clients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      {c.status === "Completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {c.status === "Burned" && <XCircle className="h-4 w-4 text-destructive" />}
                      <span>{c.clientFullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[c.status] || "outline"}>
                        {statusLabel[c.status] || c.status}
                      </Badge>
                      {(isAdmin || isTrainer) && c.status === "Scheduled" && appointment.status === "Scheduled" && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleManualCheckIn(c.id)}
                          >
                            Check-in
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive"
                            onClick={() => handleCancelClient(c.id)}
                          >
                            Iptal
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isAdmin && appointment.status === "Scheduled" && (
            <>
              <Button variant="destructive" onClick={() => handleDelete(false)}>Sadece Bunu Iptal Et</Button>
              {appointment.recurrenceGroupId && (
                <Button variant="destructive" onClick={() => handleDelete(true)}>Tumunu Iptal Et</Button>
              )}
            </>
          )}
          {isAdmin && isPastAppointment && appointment.clients.some(c => c.status === "Scheduled") && (
            <Button variant="outline" onClick={handleBurnNoShows}>Gelmeyenleri Yak</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
