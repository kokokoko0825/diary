import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ダッシュボード</h2>

      <Card>
        <CardHeader>
          <CardTitle>感情の推移</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">
              読み込み中...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              データがありません。今日の記録をつけてみましょう。
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    domain={[-1, 1]}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value != null ? value.toFixed(2) : ""
                    }
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date
                        ? `2025-${payload[0].payload.date}`
                        : ""
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="valence"
                    name="快・不快"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="arousal"
                    name="活性"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>直近の記録</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {entries.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span className="text-sm text-muted-foreground">{e.date}</span>
                  <span className="font-medium">
                    {getEmotionLabel(e.valence, e.arousal)}
                  </span>
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
