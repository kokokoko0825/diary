import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AuthProvider } from "~/contexts/auth";
import { isFirebaseReady } from "~/lib/firebase";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#e0e7ff" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function FirebaseSetupRequired() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl max-w-sm text-center space-y-4 p-6">
        <h1 className="text-2xl font-bold">MoodLog の設定</h1>
        <p className="text-muted-foreground">
          Firebase の設定が必要です。
          <code className="block mt-2 p-3 glass-subtle rounded-xl text-sm text-left">
            .env.example をコピーして .env を作成し、
            <br />
            Firebase プロジェクトの認証情報を設定してください。
          </code>
        </p>
        <p className="text-sm text-muted-foreground">
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Firebase Console
          </a>
          でプロジェクトを作成し、Authentication（Google）と Firestore を有効にしてください。
        </p>
      </div>
    </main>
  );
}

export default function App() {
  if (!isFirebaseReady) {
    return <FirebaseSetupRequired />;
  }

  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
