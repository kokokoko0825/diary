import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth";
import { getRecentEntries } from "~/lib/firestore";
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user === "loading") return;
    let cancelled = false;
    getRecentEntries(user.uid)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const chartData = [...entries]
    .reverse()
    .map((e) => ({
      date: e.date.slice(5),
      valence: e.valence,
      arousal: e.arousal,
      感情: getEmotionLabel(e.valence, e.arousal),
    }));

  return (
    <div className="space-y-5 animate-slide-up">
      <h2 className="text-xl font-bold">ダッシュボード</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">感情の推移</CardTitle>
          <CardDescription>気分のポジティブ度と活性度の日々の変化</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              読み込み中...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              データがありません。今日の記録をつけてみましょう。
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
                            <p className="font-semibold text-foreground">{data.date}</p>
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
                      dot={{ r: 3.5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="arousal"
                      name="活性度"
                      stroke="oklch(0.6 0.22 290)"
                      strokeWidth={2}
                      dot={{ r: 3.5 }}
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
              {entries.slice(0, 5).map((e) => (
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
          </CardContent>
        </Card>
      )}

      <Button asChild className="w-full" size="lg">
        <Link to="/app/quiz">今日の記録をつける</Link>
      </Button>
    </div>
  );
}
