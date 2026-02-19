import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * 毎分実行し、現在時刻に通知設定があるユーザーにプッシュ通知を送信
 */
/**
 * 東京時間の現在時刻を取得
 * Cloud FunctionsはUTCで動作するため、toLocaleString→parseは誤動作する
 * Intl.DateTimeFormatで確実に東京時間の components を取得する
 */
function getTokyoNow(): { currentTime: string; today: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  return {
    currentTime: `${hour}:${minute}`,
    today: `${year}-${month}-${day}`,
  };
}

export const sendDailyReminder = onSchedule(
  { schedule: "every 1 minutes", timeZone: "Asia/Tokyo" },
  async () => {
    const { currentTime, today } = getTokyoNow();

    // 現在時刻に通知設定があり、通知が有効なユーザーを取得
    const usersSnap = await db
      .collection("users")
      .where("notificationEnabled", "==", true)
      .where("notificationHour", "==", currentTime)
      .get();

    if (usersSnap.empty) return;

    const sendPromises: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const fcmToken = data.fcmToken as string | undefined;
      const lastNotifiedDate = data.lastNotifiedDate as string | undefined;

      // トークンがない、または今日既に通知済みならスキップ
      if (!fcmToken || lastNotifiedDate === today) continue;

      // 今日の記録があるかチェック
      const entriesSnap = await db
        .collection("users")
        .doc(userDoc.id)
        .collection("entries")
        .where("date", "==", today)
        .limit(1)
        .get();

      if (!entriesSnap.empty) continue; // 既に記録済み

      sendPromises.push(
        messaging
          .send({
            token: fcmToken,
            notification: {
              title: "MoodLog",
              body: "今日の気分を記録しましょう",
            },
            data: {
              title: "MoodLog",
              body: "今日の気分を記録しましょう",
              url: "/app/quiz",
            },
            webpush: {
              headers: {
                Urgency: "high",
                TTL: "86400",
              },
              fcmOptions: {
                link: "https://moodlog-6297c.web.app/app/quiz",
              },
            },
          })
          .then(async () => {
            await userDoc.ref.update({ lastNotifiedDate: today });
          })
          .catch(async (err) => {
            // トークンが無効な場合はクリア
            if (
              err.code === "messaging/registration-token-not-registered" ||
              err.code === "messaging/invalid-registration-token"
            ) {
              await userDoc.ref.update({ fcmToken: "" });
            }
            console.error(`Failed to send to ${userDoc.id}:`, err.message);
          })
      );
    }

    await Promise.all(sendPromises);
  }
);
