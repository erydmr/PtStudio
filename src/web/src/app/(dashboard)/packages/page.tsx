"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Package } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface PackageForm {
  name: string;
  sessionCount: string;
  defaultDurationMinutes: string;
  maxDays: string;
  price: string;
}

const emptyForm: PackageForm = { name: "", sessionCount: "", defaultDurationMinutes: "60", maxDays: "", price: "" };

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const { toast } = useToast();

  const fetchPackages = async () => {
    try {
      const data = await api.get<Package[]>("/api/package");
      setPackages(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Paketler yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      sessionCount: pkg.sessionCount.toString(),
      defaultDurationMinutes: pkg.defaultDurationMinutes.toString(),
      maxDays: pkg.maxDays?.toString() || "",
      price: pkg.price.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sessionCount: parseInt(form.sessionCount),
      defaultDurationMinutes: parseInt(form.defaultDurationMinutes),
      maxDays: form.maxDays ? parseInt(form.maxDays) : null,
      price: parseFloat(form.price),
    };
    try {
      if (editingId) {
        await api.put(`/api/package/${editingId}`, { ...payload, isActive: true });
        toast({ title: "Basarili", description: "Paket guncellendi." });
      } else {
        await api.post("/api/package", payload);
        toast({ title: "Basarili", description: "Paket olusturuldu." });
      }
      setDialogOpen(false);
      fetchPackages();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Islem basarisiz." });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu paketi silmek istediginize emin misiniz?")) return;
    try {
      await api.delete(`/api/package/${id}`);
      toast({ title: "Basarili", description: "Paket silindi." });
      fetchPackages();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Silme basarisiz." });
    }
  };

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Paket Tanimlari</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Yeni Paket</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paket Adi</TableHead>
            <TableHead>Ders Sayisi</TableHead>
            <TableHead>Sure (dk)</TableHead>
            <TableHead>Maks. Gun</TableHead>
            <TableHead>Fiyat</TableHead>
            <TableHead className="w-[100px]">Islemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="font-medium">{pkg.name}</TableCell>
              <TableCell>{pkg.sessionCount}</TableCell>
              <TableCell>{pkg.defaultDurationMinutes}</TableCell>
              <TableCell>{pkg.maxDays || "-"}</TableCell>
              <TableCell>{pkg.price.toLocaleString("tr-TR")} TL</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {packages.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Paket bulunamadi.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Paket Duzenle" : "Yeni Paket"}</DialogTitle>
            <DialogDescription>{editingId ? "Paket bilgilerini guncelleyin." : "Yeni paket bilgilerini girin."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Paket Adi</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ders Sayisi</Label>
                <Input type="number" min="1" value={form.sessionCount} onChange={(e) => setForm({ ...form, sessionCount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Sure (dk)</Label>
                <Input type="number" min="1" value={form.defaultDurationMinutes} onChange={(e) => setForm({ ...form, defaultDurationMinutes: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maks. Gun (opsiyonel)</Label>
                <Input type="number" min="1" value={form.maxDays} onChange={(e) => setForm({ ...form, maxDays: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fiyat (TL)</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Iptal</Button>
              <Button type="submit">{editingId ? "Guncelle" : "Olustur"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
