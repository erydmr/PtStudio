"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Trainer, Client, ClientPackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainers: Trainer[];
  clients: Client[];
  clientPackages: ClientPackage[];
  defaultStart: string;
  defaultEnd: string;
  onSuccess: () => void;
}

function toLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AppointmentCreateDialog({
  open, onOpenChange, trainers, clients, clientPackages,
  defaultStart, defaultEnd, onSuccess,
}: Props) {
  const { toast } = useToast();
  const [trainerId, setTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [isGroup, setIsGroup] = useState(false);
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientPackageId, setClientPackageId] = useState("");

  useEffect(() => {
    if (open) {
      setTrainerId("");
      setCapacity("1");
      setIsGroup(false);
      setNotes("");
      setClientId("");
      setClientPackageId("");
      setStartTime(toLocalDatetime(defaultStart));
      setEndTime(toLocalDatetime(defaultEnd));
    }
  }, [open, defaultStart, defaultEnd]);

  const availablePackages = clientPackages.filter(
    (cp) => cp.clientId === parseInt(clientId) && cp.remainingSessions > 0
  );

  useEffect(() => {
    if (clientId) {
      const pkgs = clientPackages.filter(
        (cp) => cp.clientId === parseInt(clientId) && cp.remainingSessions > 0
      );
      setClientPackageId(pkgs.length > 0 ? String(pkgs[0].id) : "");
    } else {
      setClientPackageId("");
    }
  }, [clientId, clientPackages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientsList = clientId && clientPackageId
      ? [{ clientId: parseInt(clientId), clientPackageId: parseInt(clientPackageId) }]
      : [];

    try {
      await api.post("/api/appointment", {
        trainerId: parseInt(trainerId),
        startTime: startTime + ":00Z",
        endTime: endTime + ":00Z",
        capacity: parseInt(capacity),
        isGroup,
        notes: notes || null,
        clients: clientsList,
      });
      toast({ title: "Basarili", description: "Randevu olusturuldu." });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Randevu olusturulamadi." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Randevu</DialogTitle>
          <DialogDescription>Randevu bilgilerini girin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Antrenor</Label>
            <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required>
              <option value="">Antrenor secin...</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Baslangic</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bitis</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kapasite</Label>
              <Input type="number" min="1" value={capacity} onChange={(e) => { setCapacity(e.target.value); setIsGroup(parseInt(e.target.value) > 1); }} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} className="rounded" />
                Grup Seansi
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Musteri (opsiyonel)</Label>
            <Select value={clientId} onChange={(e) => { setClientId(e.target.value); setClientPackageId(""); }}>
              <option value="">Musteri secin...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </Select>
          </div>
          {clientId && availablePackages.length > 0 && (
            <div className="space-y-2">
              <Label>Musteri Paketi</Label>
              {availablePackages.length === 1 ? (
                <p className="text-sm border rounded-md px-3 py-2 bg-muted">
                  {availablePackages[0].packageName} ({availablePackages[0].remainingSessions} ders kaldi)
                </p>
              ) : (
                <Select value={clientPackageId} onChange={(e) => setClientPackageId(e.target.value)} required>
                  {availablePackages.map((cp) => (
                    <option key={cp.id} value={cp.id}>{cp.packageName} ({cp.remainingSessions} ders kaldi)</option>
                  ))}
                </Select>
              )}
            </div>
          )}
          {clientId && availablePackages.length === 0 && (
            <p className="text-sm text-destructive">Bu musterinin aktif paketi bulunmuyor.</p>
          )}
          <div className="space-y-2">
            <Label>Notlar</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Iptal</Button>
            <Button type="submit">Olustur</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
