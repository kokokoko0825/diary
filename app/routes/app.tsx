import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "~/contexts/auth";
import { Button } from "~/components/ui/button";
import { useEffect } from "react";
import { cn } from "~/lib/utils";

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  if (user === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-4">
            <Link
              to="/app/dashboard"
              className="text-xl font-bold hover:opacity-80 transition-opacity"
            >
              MoodLog
            </Link>
            <div className="flex gap-1">
              <Link
                to="/app/dashboard"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === "/app/dashboard"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                ダッシュボード
              </Link>
              <Link
                to="/app/quiz"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === "/app/quiz"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                今日の記録
              </Link>
            </div>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user.displayName}
            </span>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Outlet />
      </main>
    </div>
  );
}
