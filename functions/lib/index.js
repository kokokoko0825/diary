"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailyReminder = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const messaging = (0, messaging_1.getMessaging)();
/**
 * 毎分実行し、現在時刻に通知設定があるユーザーにプッシュ通知を送信
 */
exports.sendDailyReminder = (0, scheduler_1.onSchedule)({ schedule: "every 1 minutes", timeZone: "Asia/Tokyo" }, async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    // 現在時刻に通知設定があり、通知が有効なユーザーを取得
    const usersSnap = await db
        .collection("users")
        .where("notificationEnabled", "==", true)
        .where("notificationHour", "==", currentTime)
        .get();
    if (usersSnap.empty)
        return;
    const sendPromises = [];
    for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const fcmToken = data.fcmToken;
        const lastNotifiedDate = data.lastNotifiedDate;
        // トークンがない、または今日既に通知済みならスキップ
        if (!fcmToken || lastNotifiedDate === today)
            continue;
        // 今日の記録があるかチェック
        const entriesSnap = await db
            .collection("users")
            .doc(userDoc.id)
            .collection("entries")
            .where("date", "==", today)
            .limit(1)
            .get();
        if (!entriesSnap.empty)
            continue; // 既に記録済み
        sendPromises.push(messaging
            .send({
            token: fcmToken,
            notification: {
                title: "MoodLog",
                body: "今日の気分を記録しましょう",
            },
            webpush: {
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
            if (err.code === "messaging/registration-token-not-registered" ||
                err.code === "messaging/invalid-registration-token") {
                await userDoc.ref.update({ fcmToken: "" });
            }
            console.error(`Failed to send to ${userDoc.id}:`, err.message);
        }));
    }
    await Promise.all(sendPromises);
});
//# sourceMappingURL=index.js.map