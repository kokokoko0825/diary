import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth";
import { getEntry } from "~/lib/firestore";
import { getEmotionLabel } from "~/lib/quiz-questions";
import type { DailyEntry } from "~/types/firestore";
import { ArrowLeft } from "lucide-react";

export default function EntryDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user === "loading" || !id) return;
    let cancelled = false;
    getEntry(user.uid, id)
      .then((data) => {
        if (!cancelled) setEntry(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="glass rounded-2xl px-6 py-4">
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="space-y-4 animate-slide-up">
        <p className="text-muted-foreground text-center py-16 text-sm">
          記録が見つかりませんでした
        </p>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/app/dashboard">ダッシュボードに戻る</Link>
        </Button>
      </div>
    );
  }

  const emotionLabel = getEmotionLabel(entry.valence, entry.arousal);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/app/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold">{entry.date}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">感情</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold text-primary">{emotionLabel}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <span className="block text-xs opacity-70">快・不快</span>
              <span className="font-medium text-foreground">
                {entry.valence > 0 ? "+" : ""}
                {entry.valence.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-xs opacity-70">活性度</span>
              <span className="font-medium text-foreground">
                {entry.arousal > 0 ? "+" : ""}
                {entry.arousal.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {entry.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">活動</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entry.activities.map((tag) => (
                <span
                  key={tag}
                  className="glass-subtle rounded-full px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entry.freeText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">日記</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {entry.freeText}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
