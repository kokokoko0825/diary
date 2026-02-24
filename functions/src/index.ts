import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * 毎日22:00（東京時間）に通知が有効な全ユーザーにプッシュ通知を送信
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
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

// 22:00 JST = 13:00 UTC（Asia/Tokyo指定でずれる場合があるためUTCで明示）
export const sendDailyReminder = onSchedule(
  { schedule: "0 13 * * *", timeZone: "UTC" },
  async () => {
    const { today } = getTokyoNow();
    console.log(`[sendDailyReminder] start: today=${today}`);

    // 通知が有効な全ユーザーを取得
    const usersSnap = await db
      .collection("users")
      .where("notificationEnabled", "==", true)
      .get();

    console.log(`[sendDailyReminder] users with notificationEnabled=true: ${usersSnap.size}`);
    if (usersSnap.empty) return;

    const sendPromises: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const fcmToken = data.fcmToken as string | undefined;
      const lastNotifiedDate = data.lastNotifiedDate as string | undefined;

      // トークンがない場合はスキップ
      if (!fcmToken) {
        console.log(`[sendDailyReminder] skip ${userDoc.id}: no fcmToken`);
        continue;
      }

      // 今日既に通知済みならスキップ
      if (lastNotifiedDate === today) {
        console.log(`[sendDailyReminder] skip ${userDoc.id}: already notified today`);
        continue;
      }

      console.log(`[sendDailyReminder] sending to ${userDoc.id}`);

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
            console.log(`[sendDailyReminder] success: ${userDoc.id}`);
            await userDoc.ref.update({ lastNotifiedDate: today });
          })
          .catch(async (err) => {
            console.error(`[sendDailyReminder] error for ${userDoc.id}: code=${err.code}, message=${err.message}`);
            // トークンが無効な場合はクリア
            if (
              err.code === "messaging/registration-token-not-registered" ||
              err.code === "messaging/invalid-registration-token"
            ) {
              await userDoc.ref.update({ fcmToken: "" });
            }
          })
      );
    }

    await Promise.all(sendPromises);
    console.log(`[sendDailyReminder] done: sent ${sendPromises.length} notifications`);
  }
);
