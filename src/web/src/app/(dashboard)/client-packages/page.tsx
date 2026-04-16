"use client";

import { useEffect, useState } from "react";
import { Plus, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { ClientPackage, Client, Package, CreditAdjustment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const statusLabel: Record<string, string> = { Active: "Aktif", Completed: "Tamamlandi", Expired: "Suresi Doldu" };
const statusVariant = (s: string) => {
  if (s === "Active") return "default" as const;
  if (s === "Completed") return "secondary" as const;
  return "destructive" as const;
};

export default function ClientPackagesPage() {
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");

  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditClientPackageId, setCreditClientPackageId] = useState<number | null>(null);
  const [creditClientName, setCreditClientName] = useState("");
  const [creditAmount, setCreditAmount] = useState("1");
  const [creditReason, setCreditReason] = useState("");
  const [creditHistory, setCreditHistory] = useState<CreditAdjustment[]>([]);

  const { toast } = useToast();

  const fetchAll = async () => {
    try {
      const [cpData, cData, pData] = await Promise.all([
        api.get<ClientPackage[]>("/api/clientpackage"),
        api.get<Client[]>("/api/client"),
        api.get<Package[]>("/api/package"),
      ]);
      setClientPackages(cpData);
      setClients(cData);
      setPackages(pData);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Veriler yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/clientpackage", {
        clientId: parseInt(selectedClientId),
        packageId: parseInt(selectedPackageId),
      });
      toast({ title: "Basarili", description: "Paket satisi yapildi." });
      setDialogOpen(false);
      setSelectedClientId("");
      setSelectedPackageId("");
      fetchAll();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Satis basarisiz." });
    }
  };

  const openCreditDialog = async (clientPackageId: number, clientName: string) => {
    setCreditClientPackageId(clientPackageId);
    setCreditClientName(clientName);
    setCreditAmount("1");
    setCreditReason("");
    setCreditDialogOpen(true);

    try {
      const history = await api.get<CreditAdjustment[]>(`/api/creditadjustment/by-clientpackage/${clientPackageId}`);
      setCreditHistory(history);
    } catch {
      setCreditHistory([]);
    }
  };

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditClientPackageId || !creditReason.trim()) return;

    try {
      await api.post("/api/creditadjustment", {
        clientPackageId: creditClientPackageId,
        amount: parseInt(creditAmount),
        reason: creditReason,
      });
      toast({ title: "Basarili", description: "Ders hakki duzenlendi." });
      setCreditDialogOpen(false);
      fetchAll();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Islem basarisiz." });
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("tr-TR");
  const formatDateTime = (d: string) => new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Paket Satisi</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Yeni Satis</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Musteri</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Kalan Ders</TableHead>
            <TableHead>Satin Alma</TableHead>
            <TableHead>Bitis</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">Islem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientPackages.map((cp) => (
            <TableRow key={cp.id}>
              <TableCell className="font-medium">{cp.clientFullName}</TableCell>
              <TableCell>{cp.packageName}</TableCell>
              <TableCell>{cp.remainingSessions}</TableCell>
              <TableCell>{formatDate(cp.purchaseDate)}</TableCell>
              <TableCell>{cp.expiryDate ? formatDate(cp.expiryDate) : "-"}</TableCell>
              <TableCell><Badge variant={statusVariant(cp.status)}>{statusLabel[cp.status] || cp.status}</Badge></TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => openCreditDialog(cp.id, cp.clientFullName)}>
                  <PlusCircle className="mr-1 h-4 w-4" />Ders Hakki
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {clientPackages.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Paket satisi bulunamadi.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Paket Satisi</DialogTitle>
            <DialogDescription>Musteriye paket tanimlayin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSell} className="space-y-4">
            <div className="space-y-2">
              <Label>Musteri</Label>
              <Select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
                <option value="">Musteri secin...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paket</Label>
              <Select value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} required>
                <option value="">Paket secin...</option>
                {packages.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.sessionCount} ders - {p.price.toLocaleString("tr-TR")} TL</option>)}
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Iptal</Button>
              <Button type="submit">Satisi Tamamla</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creditClientName} - Ders Hakki Duzenleme</DialogTitle>
            <DialogDescription>
              Insiyatif olarak ders hakki ekleyin veya dusun. Neden girilmesi zorunludur.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Miktar</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Ornek: 1 (ekle) veya -1 (dus)"
                required
              />
              <p className="text-xs text-muted-foreground">Pozitif = ekleme, Negatif = dusurme</p>
            </div>
            <div className="space-y-2">
              <Label>Neden</Label>
              <Input
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Neden aciklayin..."
                required
              />
            </div>

            {creditHistory.length > 0 && (
              <div>
                <Label className="mb-2 block">Gecmis Duzenlemeler</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {creditHistory.map((h) => (
                    <div key={h.id} className="text-xs border rounded px-2 py-1 flex justify-between">
                      <span>
                        <span className={h.amount > 0 ? "text-green-600" : "text-red-600"}>
                          {h.amount > 0 ? "+" : ""}{h.amount}
                        </span>
                        {" "}{h.reason}
                      </span>
                      <span className="text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreditDialogOpen(false)}>Iptal</Button>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
