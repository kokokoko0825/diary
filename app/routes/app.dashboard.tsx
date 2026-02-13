import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ダッシュボード</h2>
      <Card>
        <CardHeader>
          <CardTitle>感情の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            データが蓄積されると、ここに感情の推移グラフが表示されます。
          </p>
        </CardContent>
      </Card>
      <Button onClick={() => navigate("/app/quiz")} className="w-full">
        今日の記録をつける
      </Button>
    </div>
  );
}
