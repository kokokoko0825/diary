import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "~/contexts/auth";
import { Button } from "~/components/ui/button";
import { useEffect } from "react";
import { cn } from "~/lib/utils";
import { LayoutDashboard, PenLine, Brain, Settings, LogOut } from "lucide-react";

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
        <div className="glass rounded-2xl px-6 py-4">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー（グラスモーフィズム） */}
      <header className="glass-heavy sticky top-0 z-50 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">MoodLog</h1>
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-white/30"
              />
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 px-4 pt-4 pb-24 w-full animate-fade-in">
        <Outlet />
      </main>

      {/* ボトムナビゲーション（フローティンググラス） */}
      <nav className="fixed bottom-5 inset-x-0 z-50 flex justify-center safe-bottom px-6">
        <div className="glass-tab-bar flex items-stretch rounded-2xl w-full max-w-sm">
          <Link
            to="/app/dashboard"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all relative",
              location.pathname === "/app/dashboard"
                ? "text-primary glass-tab-active"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <LayoutDashboard className="size-5" />
            <span className="text-[10px] font-medium">ダッシュボード</span>
          </Link>
          <Link
            to="/app/quiz"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all relative",
              location.pathname === "/app/quiz"
                ? "text-primary glass-tab-active"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <PenLine className="size-5" />
            <span className="text-[10px] font-medium">記録</span>
          </Link>
          <Link
            to="/app/personality"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all relative",
              location.pathname === "/app/personality"
                ? "text-primary glass-tab-active"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <Brain className="size-5" />
            <span className="text-[10px] font-medium">診断</span>
          </Link>
          <Link
            to="/app/settings"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all relative",
              location.pathname === "/app/settings"
                ? "text-primary glass-tab-active"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <Settings className="size-5" />
            <span className="text-[10px] font-medium">設定</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
