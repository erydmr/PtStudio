"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { CheckInResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Yukleniyor...</p>
      </div>
    }>
      <CheckInContent />
    </Suspense>
  );
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    if (!token) {
      setError("Gecersiz QR kodu. Lutfen tekrar okutun.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.post<CheckInResponse>("/api/attendance/checkin", {
        studioToken: token,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in basarisiz oldu.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium">Gecersiz QR kodu</p>
            <p className="text-muted-foreground mt-2">
              Lutfen salondaki QR kodu tekrar okutun.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">PT Studio</CardTitle>
        </CardHeader>
        <CardContent>
          {!result && !error && (
            <div className="text-center space-y-4">
              <p className="text-lg">Derse hosgeldiniz!</p>
              <p className="text-muted-foreground">
                Check-in yapmak icin asagidaki butona basin.
              </p>
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                size="lg"
                className="w-full text-lg py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Kontrol ediliyor...
                  </>
                ) : (
                  "Derse Geldim"
                )}
              </Button>
            </div>
          )}

          {result && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-xl font-semibold">Check-in Basarili!</p>
              <div className="space-y-2 text-left bg-muted rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Musteri</span>
                  <span className="font-medium">{result.clientFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Antrenor</span>
                  <span className="font-medium">{result.trainerFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ders Saati</span>
                  <span className="font-medium">
                    {formatTime(result.startTime)} - {formatTime(result.endTime)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Iyi dersler!</p>
            </div>
          )}

          {error && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-lg font-medium">Check-in Yapilamadi</p>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={handleCheckIn} variant="outline" className="w-full">
                Tekrar Dene
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
