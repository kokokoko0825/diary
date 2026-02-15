import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * 通知の許可を取得し、FCMトークンを返す
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("VAPID key not configured");
    return null;
  }

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (err) {
    console.error("Failed to get FCM token:", err);
    return null;
  }
}

/**
 * FCMトークンをFirestoreに保存
 */
export async function saveFcmToken(uid: string, token: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { fcmToken: token });
}
