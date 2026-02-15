import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth";
import { useEffect } from "react";

export default function IndexPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user !== "loading") {
      navigate("/app/dashboard");
    }
  }, [user, navigate]);

  if (user === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl px-6 py-4">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="w-full max-w-sm space-y-8 animate-slide-up">
        {/* Logo area */}
        <div className="text-center space-y-3">
          <div className="glass w-20 h-20 rounded-3xl mx-auto flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">M</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MoodLog</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            毎日の感情を記録して、自分を知ろう
          </p>
        </div>

        {/* Login card */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            ラッセルの感情円環モデルに基づく10問のクイズで、
            今日の気分を可視化します。
          </p>
          <Button onClick={signIn} className="w-full" size="lg">
            Googleでログイン
          </Button>
        </div>
      </div>
    </div>
  );
}
