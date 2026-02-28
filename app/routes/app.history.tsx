import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth";
import { getAllEntries } from "~/lib/firestore";
import { getEmotionLabel } from "~/lib/quiz-questions";
import type { DailyEntry } from "~/types/firestore";
import { ArrowLeft } from "lucide-react";

export default function HistoryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user === "loading") return;
    let cancelled = false;
    getAllEntries(user.uid)
      .then((data) => {
        if (!cancelled) setEntries([...data].reverse());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/app/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold">記録履歴</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">すべての記録</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              読み込み中...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              記録がありません
            </p>
          ) : (
            <ul className="space-y-1">
              {entries.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/app/entry/${e.id}`}
                    className="flex justify-between items-center py-3 border-b border-white/10 last:border-0 active:opacity-70 transition-opacity"
                  >
                    <span className="text-sm text-muted-foreground">{e.date}</span>
                    <div className="flex items-center gap-2">
                      {e.activities.length > 0 && (
                        <span className="text-xs text-muted-foreground truncate max-w-24">
                          {e.activities[0]}
                          {e.activities.length > 1 && "..."}
                        </span>
                      )}
                      <span className="font-medium text-sm">
                        {getEmotionLabel(e.valence, e.arousal)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
