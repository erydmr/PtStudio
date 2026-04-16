"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Client } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editEmergency, setEditEmergency] = useState("");
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const data = await api.get<Client[]>("/api/client");
      setClients(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Musteriler yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openEdit = (client: Client) => {
    setEditClient(client);
    setEditFullName(client.fullName);
    setEditPhone(client.phone || "");
    setEditNotes(client.notes || "");
    setEditEmergency(client.emergencyContact || "");
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClient) return;

    try {
      await api.put(`/api/user/${editClient.userId}`, {
        fullName: editFullName,
        phone: editPhone || null,
      });

      await api.put(`/api/client/${editClient.id}`, {
        notes: editNotes || null,
        emergencyContact: editEmergency || null,
        isActive: editClient.isActive,
      });

      toast({ title: "Basarili", description: "Musteri guncellendi." });
      setEditOpen(false);
      fetchClients();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Guncelleme basarisiz." });
    }
  };

  const toggleActive = async (client: Client) => {
    const msg = client.isActive
      ? `${client.fullName} pasif yapilacak. Devam?`
      : `${client.fullName} aktif yapilacak. Devam?`;
    if (!confirm(msg)) return;

    try {
      await api.put(`/api/client/${client.id}`, {
        notes: client.notes || null,
        emergencyContact: client.emergencyContact || null,
        isActive: !client.isActive,
      });
      toast({ title: "Basarili", description: "Durum guncellendi." });
      fetchClients();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Islem basarisiz." });
    }
  };

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Musteriler</h1>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Acil Durum</TableHead>
              <TableHead>Notlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.fullName}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone || "-"}</TableCell>
                <TableCell>{c.emergencyContact || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{c.notes || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={c.isActive ? "default" : "destructive"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(c)}
                  >
                    {c.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Musteri bulunamadi.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Musteri Duzenle</DialogTitle>
            <DialogDescription>{editClient?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Acil Durum Kisisi</Label>
              <Input value={editEmergency} onChange={(e) => setEditEmergency(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Iptal</Button>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
