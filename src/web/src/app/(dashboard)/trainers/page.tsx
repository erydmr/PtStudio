"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Trainer } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get<Trainer[]>("/api/trainer");
        setTrainers(data);
      } catch (error) {
        toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Antrenorler yuklenemedi." });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Antrenorler</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Renk</TableHead>
            <TableHead>Ad Soyad</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Uzmanlik</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainers.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: t.color || "#6b7280" }} />
              </TableCell>
              <TableCell className="font-medium">{t.fullName}</TableCell>
              <TableCell>{t.email}</TableCell>
              <TableCell>{t.phone || "-"}</TableCell>
              <TableCell>{t.specialization || "-"}</TableCell>
              <TableCell><Badge variant={t.isActive ? "default" : "destructive"}>{t.isActive ? "Aktif" : "Pasif"}</Badge></TableCell>
            </TableRow>
          ))}
          {trainers.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Antrenor bulunamadi.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
