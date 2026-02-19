import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export type NotificationResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

/**
 * 通知の許可を取得し、FCMトークンを返す
 */
export async function requestNotificationPermission(): Promise<NotificationResult> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    // iOS Safariではホーム画面に追加したPWAのみ通知対応
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return {
        ok: false,
        reason: "iOSでは「ホーム画面に追加」してからお試しください",
      };
    }
    return { ok: false, reason: "このブラウザは通知に対応していません" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "通知の許可が拒否されました。ブラウザの設定から許可してください" };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { ok: false, reason: "VAPID keyが設定されていません" };
  }

  try {
    const messaging = getMessaging(app);
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    // SW が active になるまで待つ（no active Service Worker エラー防止）
    await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });
    if (!token) {
      return { ok: false, reason: "FCMトークンの取得に失敗しました" };
    }
    return { ok: true, token };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    console.error("Failed to get FCM token:", err);
    return { ok: false, reason: `トークン取得エラー: ${message}` };
  }
}

/**
 * FCMトークンをFirestoreに保存
 */
export async function saveFcmToken(uid: string, token: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { fcmToken: token });
}
