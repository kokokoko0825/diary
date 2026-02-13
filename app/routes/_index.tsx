import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth";
import { useEffect } from "react";

export default function IndexPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user !== "loading") {
      navigate("/app/quiz");
    }
  }, [user, navigate]);

  if (user === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">MoodLog</CardTitle>
          <p className="text-muted-foreground mt-2">
            毎日の感情を記録して、自分を知ろう
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            ラッセルの感情円環モデルに基づく10問のクイズで、
            今日の気分を可視化します。
          </p>
          <Button onClick={signIn} className="w-full" size="lg">
            Googleでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
