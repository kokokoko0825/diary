import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth";
import {
  getEntriesByDateRange,
  getNotificationSettings,
  saveNotificationSettings,
} from "~/lib/firestore";
import { requestNotificationPermission, saveFcmToken } from "~/lib/notifications";
import { getEmotionLabel } from "~/lib/quiz-questions";
import type { DailyEntry } from "~/types/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Brain } from "lucide-react";
import { getDiaryRangeUtc3 } from "~/lib/date";

const RANGES = [
  { key: "1w", label: "1週間", days: 7 },
  { key: "1m", label: "1ヶ月", days: 30 },
  { key: "3m", label: "3ヶ月", days: 90 },
  { key: "6m", label: "6ヶ月", days: 180 },
  { key: "1y", label: "1年", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function getDateRange(days: number) {
  const { startDate, endDate } = getDiaryRangeUtc3(days);
  return { startDate, endDate };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("1w");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const rangeDays = RANGES.find((r) => r.key === selectedRange)!.days;

  useEffect(() => {
    if (!user || user === "loading") return;
    getNotificationSettings(user.uid).then((s) => setNotificationEnabled(s.notificationEnabled));
  }, [user]);

  const handleEnableNotification = async () => {
    if (!user || user === "loading") return;
    setNotificationLoading(true);
    try {
      const result = await requestNotificationPermission();
      if (!result.ok) {
        alert(result.reason);
        return;
      }
      await saveFcmToken(user.uid, result.token);
      await saveNotificationSettings(user.uid, { notificationEnabled: true });
      setNotificationEnabled(true);
    } catch (err) {
      console.error(err);
      alert("通知の有効化に失敗しました");
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user === "loading") return;
    let cancelled = false;
    setLoading(true);
    const { startDate, endDate } = getDateRange(rangeDays);
    getEntriesByDateRange(user.uid, startDate, endDate)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, rangeDays]);

  const showDots = rangeDays <= 90;

  const chartData = entries.map((e) => ({
    date: rangeDays <= 90 ? e.date.slice(5) : e.date.slice(0, 7),
    fullDate: e.date,
    valence: e.valence,
    arousal: e.arousal,
    感情: getEmotionLabel(e.valence, e.arousal),
  }));

  return (
    <div className="space-y-5 animate-slide-up">
      <h2 className="text-xl font-bold">ダッシュボード</h2>

      {/* 22時リマインダー（未有効の場合のみ表示） */}
      {!notificationEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">リマインダー通知</CardTitle>
            <CardDescription>毎日22時に今日の記録をお知らせします</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleEnableNotification}
              disabled={notificationLoading}
              className="w-full"
            >
              {notificationLoading ? "設定中..." : "通知をONにする"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">感情の推移</CardTitle>
          <CardDescription>気分のポジティブ度と活性度の日々の変化</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 期間選択ボタン */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelectedRange(r.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedRange === r.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              読み込み中...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              この期間のデータがありません。
            </p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 270 / 0.2)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="oklch(0.5 0.02 270)"
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <ReferenceLine y={0} stroke="oklch(0.5 0.02 270)" strokeWidth={1} />
                    <YAxis
                      domain={[-1, 1]}
                      ticks={[-1, -0.5, 0, 0.5, 1]}
                      tick={{ fontSize: 10 }}
                      stroke="oklch(0.5 0.02 270)"
                      tickFormatter={(v: number) =>
                        v === 1 ? "+1" : v === -1 ? "-1" : String(v)
                      }
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0]?.payload;
                        if (!data) return null;
                        return (
                          <div
                            className="glass rounded-xl px-3 py-2 text-xs space-y-1"
                          >
                            <p className="font-semibold text-foreground">{data.fullDate}</p>
                            <p className="text-foreground/80">
                              快・不快: <span className="font-medium">{data.valence?.toFixed(2)}</span>
                            </p>
                            <p className="text-foreground/80">
                              活性度: <span className="font-medium">{data.arousal?.toFixed(2)}</span>
                            </p>
                            <p className="text-primary font-medium pt-0.5 border-t border-foreground/10">
                              {data.感情}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valence"
                      name="快・不快"
                      stroke="oklch(0.55 0.2 265)"
                      strokeWidth={2}
                      dot={showDots ? { r: 3.5 } : false}
                    />
                    <Line
                      type="monotone"
                      dataKey="arousal"
                      name="活性度"
                      stroke="oklch(0.6 0.22 290)"
                      strokeWidth={2}
                      dot={showDots ? { r: 3.5 } : false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* 凡例 */}
              <div className="flex justify-center gap-x-4 mt-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: "oklch(0.55 0.2 265)" }} />
                  <span>快・不快<span className="opacity-60">（+嬉しい / −つらい）</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: "oklch(0.6 0.22 290)" }} />
                  <span>活性度<span className="opacity-60">（+活発 / −穏やか）</span></span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">直近の記録</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {entries.slice(-5).reverse().map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/app/entry/${e.id}`}
                    className="flex justify-between items-center py-3 border-b border-white/10 last:border-0 active:opacity-70 transition-opacity"
                  >
                    <span className="text-sm text-muted-foreground">{e.date}</span>
                    <span className="font-medium text-sm">
                      {getEmotionLabel(e.valence, e.arousal)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild variant="ghost" size="sm" className="w-full mt-2">
              <Link to="/app/history">履歴を見る</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild className="flex-1" size="lg">
          <Link to="/app/quiz">今日の記録をつける</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/app/personality">
            <Brain className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
