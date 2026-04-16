"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ClientPackage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabel: Record<string, string> = { Active: "Aktif", Completed: "Tamamlandi", Expired: "Suresi Doldu" };
const statusVariant = (s: string) => {
  if (s === "Active") return "default" as const;
  if (s === "Completed") return "secondary" as const;
  return "destructive" as const;
};

export default function MyPackagesPage() {
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get<ClientPackage[]>("/api/clientpackage/my");
        setPackages(data);
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("tr-TR");

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paketlerim</h1>

      {packages.length === 0 ? (
        <p className="text-muted-foreground">Henuz aktif paketiniz bulunmuyor.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((cp) => (
            <Card key={cp.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{cp.packageName}</CardTitle>
                <Badge variant={statusVariant(cp.status)}>{statusLabel[cp.status] || cp.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kalan Ders</span>
                    <span className="font-semibold text-lg">{cp.remainingSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Satin Alma</span>
                    <span>{formatDate(cp.purchaseDate)}</span>
                  </div>
                  {cp.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bitis Tarihi</span>
                      <span>{formatDate(cp.expiryDate)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
