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
  onSuccess: () => void;
}

const dayNames = ["Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi", "Pazar"];
const dayValues = [1, 2, 3, 4, 5, 6, 0]; // DayOfWeek enum: Mon=1..Sat=6, Sun=0

export function RecurringDialog({ open, onOpenChange, trainers, clients, clientPackages, onSuccess }: Props) {
  const { toast } = useToast();
  const [trainerId, setTrainerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTimeOfDay, setStartTimeOfDay] = useState("10:00");
  const [endTimeOfDay, setEndTimeOfDay] = useState("11:00");
  const [weeks, setWeeks] = useState("4");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [capacity, setCapacity] = useState("1");
  const [isGroup, setIsGroup] = useState(false);
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientPackageId, setClientPackageId] = useState("");

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

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
    if (selectedDays.length === 0) {
      toast({ variant: "destructive", title: "Hata", description: "En az bir gun secin." });
      return;
    }

    const clientsList = clientId && clientPackageId
      ? [{ clientId: parseInt(clientId), clientPackageId: parseInt(clientPackageId) }]
      : [];

    try {
      const result = await api.post<unknown[]>("/api/appointment/recurring", {
        trainerId: parseInt(trainerId),
        startDate: startDate + "T00:00:00Z",
        startTimeOfDay: startTimeOfDay + ":00",
        endTimeOfDay: endTimeOfDay + ":00",
        days: selectedDays,
        weeks: parseInt(weeks),
        capacity: parseInt(capacity),
        isGroup,
        notes: notes || null,
        clients: clientsList,
      });
      toast({ title: "Basarili", description: `${(result as unknown[]).length} randevu olusturuldu.` });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Randevular olusturulamadi." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tekrarlayan Randevu</DialogTitle>
          <DialogDescription>Haftalik tekrarlayan randevu olusturun.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Antrenor</Label>
            <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required>
              <option value="">Antrenor secin...</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Baslangic Tarihi</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Saat (baslangic)</Label>
              <Input type="time" value={startTimeOfDay} onChange={(e) => setStartTimeOfDay(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Saat (bitis)</Label>
              <Input type="time" value={endTimeOfDay} onChange={(e) => setEndTimeOfDay(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gunler</Label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((name, i) => (
                <Button
                  key={dayValues[i]}
                  type="button"
                  variant={selectedDays.includes(dayValues[i]) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(dayValues[i])}
                >
                  {name.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kac Hafta</Label>
              <Input type="number" min="1" max="52" value={weeks} onChange={(e) => setWeeks(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Kapasite</Label>
              <Input type="number" min="1" value={capacity} onChange={(e) => { setCapacity(e.target.value); setIsGroup(parseInt(e.target.value) > 1); }} />
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
