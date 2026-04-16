"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusLabel: Record<string, string> = {
  Scheduled: "Planlanmis",
  Completed: "Tamamlandi",
  Cancelled: "Iptal Edildi",
  Burned: "Yandi",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Scheduled: "default",
  Completed: "secondary",
  Cancelled: "outline",
  Burned: "destructive",
};

export default function MyLessonsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const now = new Date();
      const fromDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
      const toDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 2, 0));
      const from = fromDate.toISOString();
      const to = toDate.toISOString();
      const data = await api.get<Appointment[]>(`/api/appointment/my?from=${from}&to=${to}`);
      setAppointments(data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Dersler yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentClientId: number) => {
    if (!confirm("Bu dersi iptal etmek istediginize emin misiniz?")) return;

    try {
      const data = await api.post<{ success: boolean; burned: boolean; message: string }>(
        `/api/cancellation/${appointmentClientId}`
      );

      if (data.burned) {
        toast({ variant: "destructive", title: "Gec Iptal", description: data.message });
      } else {
        toast({ title: "Basarili", description: data.message });
      }
      fetchAppointments();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Iptal basarisiz." });
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getMyClientItem = (appointment: Appointment) => {
    return appointment.clients.find((c) => c.status !== undefined) || appointment.clients[0];
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Yukleniyor...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Derslerim</h1>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Henuz bir dersiniz bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Saat</TableHead>
                <TableHead>Antrenor</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((a) => {
                const clientItem = getMyClientItem(a);
                const clientStatus = clientItem?.status || a.status;
                const isUpcoming = clientStatus === "Scheduled" && new Date(a.startTime) > new Date();

                return (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.startTime)}</TableCell>
                    <TableCell>
                      {formatTime(a.startTime)} - {formatTime(a.endTime)}
                    </TableCell>
                    <TableCell>{a.trainerFullName}</TableCell>
                    <TableCell>{a.isGroup ? "Grup" : "Bireysel"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[clientStatus] || "outline"}>
                        {statusLabel[clientStatus] || clientStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isUpcoming && clientItem && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(clientItem.id)}
                        >
                          Iptal Et
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
