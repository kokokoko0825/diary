/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyC4zVXd_WFd-iNAsVWttovw4bnGt5x0yY8",
  authDomain: "moodlog-6297c.firebaseapp.com",
  projectId: "moodlog-6297c",
  storageBucket: "moodlog-6297c.firebasestorage.app",
  messagingSenderId: "308519914538",
  appId: "1:308519914538:web:849b6129b5863ca55ac753",
});

const messaging = firebase.messaging();

// iOS Safari PWA 向け — 標準 Web Push API の push イベント
self.addEventListener("push", (event) => {
  // Firebase SDK が既にハンドルした場合はスキップ
  if (event.__handled) return;

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    try {
      data = { body: event.data?.text() || "" };
    } catch {
      // データなし
    }
  }

  // FCM の notification ペイロードがある場合はブラウザが自動表示するためスキップ
  // iOS Safari では notification ペイロードの方が確実に届く
  if (data.notification) return;

  const payload = data.data || data;
  const title = payload.title || "MoodLog";
  const options = {
    body: payload.body || "今日の気分を記録しましょう",
    icon: "/icon.png",
    data: { url: payload.url || "/app/quiz" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知タップ時にアプリを開く
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/app/quiz";
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // 既に開いているタブがあればフォーカス
      for (const client of windowClients) {
        if (client.url === fullUrl && "focus" in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウで開く
      return clients.openWindow(fullUrl);
    })
  );
});
