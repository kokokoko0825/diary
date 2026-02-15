import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth";
import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "~/lib/firestore";
import {
  requestNotificationPermission,
  saveFcmToken,
} from "~/lib/notifications";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => {
  const hh = String(h).padStart(2, "0");
  return { label: `${hh}:00`, value: `${hh}:00` };
});

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationEnabled: false,
    notificationHour: "09:00",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user === "loading") return;
    getNotificationSettings(user.uid)
      .then(setSettings)
      .finally(() => setLoading(false));
  }, [user]);

  const handleToggle = async () => {
    if (!user || user === "loading") return;
    setSaving(true);
    setMessage(null);

    try {
      const newEnabled = !settings.notificationEnabled;

      if (newEnabled) {
        // 通知ONにする場合、許可を取得してトークンを保存
        const result = await requestNotificationPermission();
        if (!result.ok) {
          setMessage(result.reason);
          setSaving(false);
          return;
        }
        await saveFcmToken(user.uid, result.token);
      }

      const newSettings = { ...settings, notificationEnabled: newEnabled };
      await saveNotificationSettings(user.uid, newSettings);
      setSettings(newSettings);
      setMessage(newEnabled ? "通知をONにしました" : "通知をOFFにしました");
    } catch (err) {
      setMessage("設定の保存に失敗しました");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    if (!user || user === "loading") return;
    setSaving(true);
    setMessage(null);

    try {
      const newSettings = { ...settings, notificationHour: newTime };
      await saveNotificationSettings(user.uid, newSettings);
      setSettings(newSettings);
      setMessage(`通知時刻を ${newTime} に変更しました`);
    } catch (err) {
      setMessage("設定の保存に失敗しました");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="glass rounded-2xl px-6 py-4">
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <h2 className="text-xl font-bold">設定</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">リマインダー通知</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 通知ON/OFF */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">毎日の通知</p>
              <p className="text-xs text-muted-foreground">
                記録の時間をお知らせします
              </p>
            </div>
            <Button
              variant={settings.notificationEnabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggle}
              disabled={saving}
            >
              {settings.notificationEnabled ? "ON" : "OFF"}
            </Button>
          </div>

          {/* 通知時刻 */}
          {settings.notificationEnabled && (
            <div className="space-y-2">
              <p className="text-sm font-medium">通知時刻</p>
              <div className="grid grid-cols-4 gap-2">
                {HOUR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleTimeChange(opt.value)}
                    disabled={saving}
                    className={`rounded-xl py-2 text-xs font-medium transition-all ${
                      settings.notificationHour === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "glass-subtle active:scale-95"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {message && (
            <p className="text-xs text-muted-foreground glass-subtle rounded-xl p-3 text-center">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
