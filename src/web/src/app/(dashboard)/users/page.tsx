"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface UserForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  specialization: string;
  color: string;
  notes: string;
  emergencyContact: string;
}

const emptyForm: UserForm = {
  fullName: "", email: "", phone: "", password: "",
  role: "Client", specialization: "", color: "#3b82f6",
  notes: "", emergencyContact: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const data = await api.get<User[]>("/api/user");
      setUsers(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Kullanicilar yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
      specialization: "", color: "#3b82f6",
      notes: "", emergencyContact: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/user/${editingId}`, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || null,
          role: ["Admin", "Trainer", "Client"].indexOf(form.role),
          isActive: true,
        });
        toast({ title: "Basarili", description: "Kullanici guncellendi." });
      } else {
        await api.post("/api/auth/register", {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: ["Admin", "Trainer", "Client"].indexOf(form.role),
          specialization: form.role === "Trainer" ? form.specialization || null : null,
          color: form.role === "Trainer" ? form.color || null : null,
          notes: form.role === "Client" ? form.notes || null : null,
          emergencyContact: form.role === "Client" ? form.emergencyContact || null : null,
        });
        toast({ title: "Basarili", description: "Kullanici olusturuldu." });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Islem basarisiz." });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kullaniciyi silmek istediginize emin misiniz?")) return;
    try {
      await api.delete(`/api/user/${id}`);
      toast({ title: "Basarili", description: "Kullanici silindi." });
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Silme basarisiz." });
    }
  };

  const roleLabel: Record<string, string> = { Admin: "Yonetici", Trainer: "Antrenor", Client: "Musteri" };

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kullanicilar</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Yeni Kullanici</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad Soyad</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="w-[100px]">Islemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || "-"}</TableCell>
              <TableCell><Badge variant="secondary">{roleLabel[user.role] || user.role}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Kullanici bulunamadi.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Kullanici Duzenle" : "Yeni Kullanici"}</DialogTitle>
            <DialogDescription>{editingId ? "Kullanici bilgilerini guncelleyin." : "Yeni kullanici bilgilerini girin."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={!!editingId}>
                  <option value="Admin">Yonetici</option>
                  <option value="Trainer">Antrenor</option>
                  <option value="Client">Musteri</option>
                </Select>
              </div>
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label>Sifre</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            )}
            {!editingId && form.role === "Trainer" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Uzmanlik</Label>
                  <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Renk</Label>
                  <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
              </div>
            )}
            {!editingId && form.role === "Client" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Acil Durum Iletisim</Label>
                  <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
                </div>
              </div>
            )}
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
