import { Outlet, useNavigate } from "react-router";
import { useAuth } from "~/contexts/auth";
import { Button } from "~/components/ui/button";
import { useEffect } from "react";

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
          <h1 className="text-xl font-bold">MoodLog</h1>
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
