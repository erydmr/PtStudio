"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Setting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, QrCode, Copy } from "lucide-react";

const settingLabels: Record<string, string> = {
  CancellationWindowHours: "Iptal Suresi (Saat)",
  StudioQrToken: "Salon QR Token",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get<Setting[]>("/api/setting");
      setSettings(data);
      const values: Record<number, string> = {};
      data.forEach((s) => (values[s.id] = s.value));
      setEditValues(values);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Ayarlar yuklenemedi." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (setting: Setting) => {
    const newValue = editValues[setting.id];
    if (newValue === setting.value) return;

    try {
      await api.put(`/api/setting/${setting.id}`, { value: newValue });
      toast({ title: "Basarili", description: `${settingLabels[setting.key] || setting.key} guncellendi.` });
      fetchSettings();
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: error instanceof Error ? error.message : "Guncelleme basarisiz." });
    }
  };

  const getQrUrl = () => {
    const qrSetting = settings.find((s) => s.key === "StudioQrToken");
    if (!qrSetting) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/checkin?token=${qrSetting.value}`;
  };

  const copyQrUrl = () => {
    const url = getQrUrl();
    navigator.clipboard.writeText(url);
    toast({ title: "Kopyalandi", description: "QR URL panoya kopyalandi." });
  };

  if (loading) return <p className="text-muted-foreground">Yukleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>

      <div className="grid gap-6">
        {settings
          .filter((s) => s.key !== "StudioQrToken")
          .map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {settingLabels[setting.key] || setting.key}
                </CardTitle>
                {setting.description && (
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={editValues[setting.id] || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, [setting.id]: e.target.value })
                    }
                  />
                  <Button onClick={() => handleSave(setting)}>
                    <Save className="mr-2 h-4 w-4" />Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Salon QR Kodu
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Bu URL&apos;yi QR kod olarak yazdirup salona asin. Musteriler telefonuyla okutup check-in yapabilir.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={getQrUrl()} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={copyQrUrl}>
                  <Copy className="mr-2 h-4 w-4" />Kopyala
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu URL&apos;yi herhangi bir QR kod ureteci ile QR koda cevirip yazdiabilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
