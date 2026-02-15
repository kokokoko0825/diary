import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth";
import { getAllEntries } from "~/lib/firestore";
import {
  assessPersonality,
  MIN_ENTRIES,
  type PersonalityResult,
  type ConfidenceLevel,
} from "~/lib/personality-assessment";
import type { DailyEntry } from "~/types/firestore";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft } from "lucide-react";

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const config = {
    low: { label: "信頼度: 低", className: "bg-amber-500/20 text-amber-700" },
    medium: { label: "信頼度: 中", className: "bg-blue-500/20 text-blue-700" },
    high: { label: "信頼度: 高", className: "bg-emerald-500/20 text-emerald-700" },
  };
  const c = config[level];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.className}`}>
      {c.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-foreground/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-700"
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function PersonalityPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PersonalityResult | null>(null);

  useEffect(() => {
    if (!user || user === "loading") return;
    let cancelled = false;
    getAllEntries(user.uid)
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
        if (data.length >= MIN_ENTRIES) {
          setResult(assessPersonality(data));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass rounded-2xl px-6 py-4">
          <p className="text-muted-foreground">分析中...</p>
        </div>
      </div>
    );
  }

  // データ不足
  if (entries.length < MIN_ENTRIES) {
    const remaining = MIN_ENTRIES - entries.length;
    return (
      <div className="space-y-5 animate-slide-up">
        <Link
          to="/app/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          ダッシュボード
        </Link>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-4xl">🔬</p>
            <h2 className="text-lg font-bold">パーソナリティ診断</h2>
            <p className="text-muted-foreground text-sm">
              あと<span className="font-bold text-primary">{remaining}日</span>
              記録すると診断が利用できます。
            </p>
            <p className="text-xs text-muted-foreground">
              正確な診断には最低{MIN_ENTRIES}日分のデータが必要です。
              <br />
              30日以上で信頼度の高い結果が得られます。
            </p>
            <Button asChild className="mt-4">
              <Link to="/app/quiz">今日の記録をつける</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) return null;

  const radarData = result.traits.map((t) => ({
    trait: t.label,
    score: t.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-5 animate-slide-up">
      <Link
        to="/app/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        ダッシュボード
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">パーソナリティ診断</h2>
        <ConfidenceBadge level={result.confidence} />
      </div>

      <p className="text-xs text-muted-foreground">
        {result.entryCount}日分のデータ（{result.periodDays}日間）から分析
      </p>

      {/* レーダーチャート */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Big Five プロフィール</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="oklch(0.7 0.02 270 / 0.3)" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.02 270)" }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "oklch(0.5 0.02 270)" }}
                  tickCount={5}
                />
                <Radar
                  name="スコア"
                  dataKey="score"
                  stroke="oklch(0.55 0.2 265)"
                  fill="oklch(0.55 0.2 265)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 特性カード */}
      {result.traits.map((trait) => (
        <Card key={trait.key}>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">{trait.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {trait.labelEn}
                </span>
              </div>
              <span className="text-lg font-bold text-primary">
                {trait.score}
              </span>
            </div>
            <ScoreBar score={trait.score} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {trait.description}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* 注意書き */}
      <div className="glass-subtle rounded-2xl p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          この診断について
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          この結果は日々の感情記録パターンから統計的に推定したものであり、
          臨床的な性格診断ではありません。自己理解を深めるための参考としてご利用ください。
          感情ダイナミクスと性格特性の関連性に関する心理学研究（Kuppens et al., 2007;
          Augustine & Larsen, 2012; Fleeson, 2001）に基づいています。
        </p>
      </div>
    </div>
  );
}
