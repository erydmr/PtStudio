"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Client } from "@/lib/types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function MyClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get<Client[]>("/api/client");
        setClients(data);
      } catch (error) {
        toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Musteriler yuklenemedi." });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Musterilerim</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad Soyad</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Notlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.fullName}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.phone || "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{c.notes || "-"}</TableCell>
            </TableRow>
          ))}
          {clients.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Musteri bulunamadi.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
