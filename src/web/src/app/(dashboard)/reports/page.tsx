"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TrainerReport, ClientReport, RevenueReport, CancellationReport } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

type Tab = "trainers" | "clients" | "revenue" | "cancellations";

const tabs: { key: Tab; label: string }[] = [
  { key: "trainers", label: "Antrenor Raporu" },
  { key: "clients", label: "Musteri Raporu" },
  { key: "revenue", label: "Gelir Raporu" },
  { key: "cancellations", label: "Iptal/Yanma" },
];

function getDefaultDates() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("trainers");
  const defaults = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const [trainerData, setTrainerData] = useState<TrainerReport[]>([]);
  const [clientData, setClientData] = useState<ClientReport[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueReport[]>([]);
  const [cancellationData, setCancellationData] = useState<CancellationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = `from=${fromDate}&to=${toDate}`;
      switch (activeTab) {
        case "trainers":
          setTrainerData(await api.get<TrainerReport[]>(`/api/report/trainers?${params}`));
          break;
        case "clients":
          setClientData(await api.get<ClientReport[]>(`/api/report/clients?${params}`));
          break;
        case "revenue":
          setRevenueData(await api.get<RevenueReport[]>(`/api/report/revenue?${params}`));
          break;
        case "cancellations":
          setCancellationData(await api.get<CancellationReport[]>(`/api/report/cancellations?${params}`));
          break;
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Rapor yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = `from=${fromDate}&to=${toDate}`;
      const fileNames: Record<Tab, string> = {
        trainers: `antrenor-raporu-${fromDate}-${toDate}.xlsx`,
        clients: `musteri-raporu-${fromDate}-${toDate}.xlsx`,
        revenue: `gelir-raporu-${fromDate}-${toDate}.xlsx`,
        cancellations: `iptal-yanma-raporu-${fromDate}-${toDate}.xlsx`,
      };
      await api.downloadFile(`/api/report/${activeTab}/export?${params}`, fileNames[activeTab]);
      toast({ title: "Basarili", description: "Excel dosyasi indirildi." });
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Export basarisiz." });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Raporlar</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Baslangic</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Bitis</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? "Yukleniyor..." : "Filtrele"}
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Indiriliyor..." : "Excel Indir"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === "trainers" && <TrainerReportTable data={trainerData} />}
      {activeTab === "clients" && <ClientReportTable data={clientData} />}
      {activeTab === "revenue" && <RevenueReportView data={revenueData} />}
      {activeTab === "cancellations" && <CancellationReportView data={cancellationData} />}
    </div>
  );
}

function TrainerReportTable({ data }: { data: TrainerReport[] }) {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Antrenor</TableHead>
            <TableHead className="text-center">Toplam Ders</TableHead>
            <TableHead className="text-center">Tamamlanan</TableHead>
            <TableHead className="text-center">Iptal</TableHead>
            <TableHead className="text-center">Yanan</TableHead>
            <TableHead className="text-center">Musteri Sayisi</TableHead>
            <TableHead className="text-center">Tamamlanma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.trainerId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color || "#3b82f6" }} />
                  <span className="font-medium">{r.trainerFullName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">{r.totalLessons}</TableCell>
              <TableCell className="text-center">{r.completedLessons}</TableCell>
              <TableCell className="text-center">{r.cancelledLessons}</TableCell>
              <TableCell className="text-center">{r.burnedLessons}</TableCell>
              <TableCell className="text-center">{r.uniqueClientCount}</TableCell>
              <TableCell className="text-center">
                <Badge variant={r.completionRate >= 80 ? "default" : r.completionRate >= 50 ? "secondary" : "destructive"}>
                  %{r.completionRate}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ClientReportTable({ data }: { data: ClientReport[] }) {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Musteri</TableHead>
            <TableHead className="text-center">Toplam Ders</TableHead>
            <TableHead className="text-center">Tamamlanan</TableHead>
            <TableHead className="text-center">Iptal</TableHead>
            <TableHead className="text-center">Yanan</TableHead>
            <TableHead className="text-center">Kalan Hak</TableHead>
            <TableHead className="text-center">Aktif Paket</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.clientId}>
              <TableCell className="font-medium">{r.clientFullName}</TableCell>
              <TableCell className="text-center">{r.totalLessons}</TableCell>
              <TableCell className="text-center">{r.completedLessons}</TableCell>
              <TableCell className="text-center">{r.cancelledLessons}</TableCell>
              <TableCell className="text-center">{r.burnedLessons}</TableCell>
              <TableCell className="text-center">
                <Badge variant={r.totalRemainingSessions > 0 ? "default" : "destructive"}>
                  {r.totalRemainingSessions}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{r.activePackageCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RevenueReportView({ data }: { data: RevenueReport[] }) {
  if (data.length === 0) return <EmptyState />;

  const totalRevenue = data.reduce((sum, r) => sum + r.revenue, 0);
  const totalPackages = data.reduce((sum, r) => sum + r.packagesSold, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString("tr-TR")} TL</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Satilan Paket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPackages}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ay</TableHead>
              <TableHead className="text-right">Gelir</TableHead>
              <TableHead className="text-center">Satilan Paket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={`${r.year}-${r.month}`}>
                <TableCell className="font-medium capitalize">{r.monthName}</TableCell>
                <TableCell className="text-right">{r.revenue.toLocaleString("tr-TR")} TL</TableCell>
                <TableCell className="text-center">{r.packagesSold}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        {data.map((r) => {
          const maxRevenue = Math.max(...data.map((d) => d.revenue));
          const width = maxRevenue > 0 ? (r.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={`${r.year}-${r.month}`} className="flex items-center gap-3">
              <span className="text-sm w-32 capitalize">{r.monthName}</span>
              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full flex items-center justify-end px-2"
                  style={{ width: `${Math.max(width, 2)}%` }}
                >
                  {width > 20 && (
                    <span className="text-xs text-primary-foreground font-medium">
                      {r.revenue.toLocaleString("tr-TR")} TL
                    </span>
                  )}
                </div>
              </div>
              {width <= 20 && (
                <span className="text-xs text-muted-foreground">{r.revenue.toLocaleString("tr-TR")} TL</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CancellationReportView({ data }: { data: CancellationReport[] }) {
  if (data.length === 0) return <EmptyState />;

  const totalLessons = data.reduce((sum, r) => sum + r.totalLessons, 0);
  const totalCancelled = data.reduce((sum, r) => sum + r.cancelledLessons, 0);
  const totalBurned = data.reduce((sum, r) => sum + r.burnedLessons, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Iptal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{totalCancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalBurned}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ay</TableHead>
              <TableHead className="text-center">Toplam</TableHead>
              <TableHead className="text-center">Tamamlanan</TableHead>
              <TableHead className="text-center">Iptal</TableHead>
              <TableHead className="text-center">Yanan</TableHead>
              <TableHead className="text-center">Iptal Orani</TableHead>
              <TableHead className="text-center">Yanma Orani</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={`${r.year}-${r.month}`}>
                <TableCell className="font-medium capitalize">{r.monthName}</TableCell>
                <TableCell className="text-center">{r.totalLessons}</TableCell>
                <TableCell className="text-center">{r.completedLessons}</TableCell>
                <TableCell className="text-center">{r.cancelledLessons}</TableCell>
                <TableCell className="text-center">{r.burnedLessons}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={r.cancellationRate <= 10 ? "secondary" : "destructive"}>
                    %{r.cancellationRate}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={r.burnRate <= 5 ? "secondary" : "destructive"}>
                    %{r.burnRate}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        {data.map((r) => {
          const total = r.totalLessons || 1;
          const completedPct = (r.completedLessons / total) * 100;
          const cancelledPct = (r.cancelledLessons / total) * 100;
          const burnedPct = (r.burnedLessons / total) * 100;
          const scheduledPct = 100 - completedPct - cancelledPct - burnedPct;

          return (
            <div key={`bar-${r.year}-${r.month}`}>
              <span className="text-sm capitalize">{r.monthName}</span>
              <div className="flex h-6 rounded-full overflow-hidden bg-muted mt-1">
                {completedPct > 0 && (
                  <div className="bg-green-500 h-full" style={{ width: `${completedPct}%` }} title={`Tamamlanan: ${r.completedLessons}`} />
                )}
                {scheduledPct > 0 && (
                  <div className="bg-blue-500 h-full" style={{ width: `${scheduledPct}%` }} title={`Planlanmis: ${r.totalLessons - r.completedLessons - r.cancelledLessons - r.burnedLessons}`} />
                )}
                {cancelledPct > 0 && (
                  <div className="bg-orange-400 h-full" style={{ width: `${cancelledPct}%` }} title={`Iptal: ${r.cancelledLessons}`} />
                )}
                {burnedPct > 0 && (
                  <div className="bg-red-500 h-full" style={{ width: `${burnedPct}%` }} title={`Yanan: ${r.burnedLessons}`} />
                )}
              </div>
            </div>
          );
        })}
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Tamamlanan</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Planlanmis</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> Iptal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Yanan</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        Secilen tarih araliginda veri bulunamadi.
      </CardContent>
    </Card>
  );
}
