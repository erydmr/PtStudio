"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Dashboard } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Package,
  XCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (user?.role === "Client") {
      router.replace("/calendar");
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    fetchDashboard();
  }, [isAdmin, user, router]);

  const fetchDashboard = async () => {
    try {
      const result = await api.get<Dashboard>("/api/dashboard");
      setData(result);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Dashboard yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Hos Geldiniz, {user?.fullName}</h1>
        <p className="text-muted-foreground">
          PT Studio yonetim paneline hosgeldiniz. Sol menuden islemlerinize ulasabilirsiniz.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;
  if (!data) return <p className="text-muted-foreground">Veriler yuklenemedi.</p>;

  const revenueChange = data.previousMonthRevenue > 0
    ? ((data.monthlyRevenue - data.previousMonthRevenue) / data.previousMonthRevenue * 100).toFixed(1)
    : null;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugunun Dersleri</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayLessonCount}</div>
            <p className="text-xs text-muted-foreground">
              {data.todayCompletedCount} tamamlandi, {data.todayBurnedCount} yandi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Musteriler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeClientCount}</div>
            <p className="text-xs text-muted-foreground">
              {data.monthlyNewClientCount > 0 ? `+${data.monthlyNewClientCount} bu ay` : "Bu ay yeni musteri yok"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aylik Gelir</CardTitle>
            {revenueChange && parseFloat(revenueChange) >= 0
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.monthlyRevenue.toLocaleString("tr-TR")} TL</div>
            <p className="text-xs text-muted-foreground">
              {revenueChange
                ? `${parseFloat(revenueChange) >= 0 ? "+" : ""}${revenueChange}% gecen aya gore`
                : "Onceki ay verisi yok"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iptal Orani</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{data.cancellationRate}</div>
            <p className="text-xs text-muted-foreground">
              {data.monthlyCancelledCount} iptal, {data.monthlyBurnedCount} yandi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Antrenorler</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeTrainerCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Paketler</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activePackageCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aylik Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.monthlyCompletedCount}</div>
            <p className="text-xs text-muted-foreground">ders tamamlandi</p>
          </CardContent>
        </Card>
      </div>

      {data.upcomingLessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bugun Yaklasan Dersler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upcomingLessons.map((lesson) => (
                <div
                  key={lesson.appointmentId}
                  className="flex items-center justify-between border rounded-md px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: lesson.trainerColor || "#3b82f6" }}
                    />
                    <div>
                      <p className="font-medium">{lesson.trainerFullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {lesson.clientCount}/{lesson.capacity}
                    </span>
                    {lesson.isGroup && (
                      <Badge variant="outline">Grup</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
