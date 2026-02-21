import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { DailyEntry } from "~/types/firestore";

/** ユーザードキュメントを作成/更新 */
export async function upsertUser(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}) {
  const ref = doc(db, "users", user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** 通知設定の型（22:00固定） */
export interface NotificationSettings {
  notificationEnabled: boolean;
}

/** 通知設定を取得 */
export async function getNotificationSettings(
  uid: string
): Promise<NotificationSettings> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  return {
    notificationEnabled: data?.notificationEnabled ?? false,
  };
}

/** 通知設定を保存 */
export async function saveNotificationSettings(
  uid: string,
  settings: NotificationSettings
): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    notificationEnabled: settings.notificationEnabled,
  });
}

/** 日記エントリーを保存 */
export async function saveDailyEntry(
  uid: string,
  entry: Omit<DailyEntry, "id" | "createdAt">
) {
  const entriesRef = collection(db, "users", uid, "entries");
  const newDoc = doc(entriesRef);
  await setDoc(newDoc, {
    ...entry,
    id: newDoc.id,
    createdAt: serverTimestamp(),
  });
  return newDoc.id;
}

/** 指定日の記録が存在するか確認 */
export async function hasEntryForDate(
  uid: string,
  date: string
): Promise<boolean> {
  const entriesRef = collection(db, "users", uid, "entries");
  const q = query(entriesRef, where("date", "==", date), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/** エントリーを1件取得 */
export async function getEntry(
  uid: string,
  entryId: string
): Promise<DailyEntry | null> {
  const ref = doc(db, "users", uid, "entries", entryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    date: data.date ?? "",
    valence: data.valence ?? 0,
    arousal: data.arousal ?? 0,
    valenceAnswers: data.valenceAnswers ?? [],
    arousalAnswers: data.arousalAnswers ?? [],
    activities: data.activities ?? [],
    freeText: data.freeText ?? "",
    createdAt: data.createdAt,
  } as DailyEntry;
}

/** ユーザーの全エントリーを日付昇順で取得（性格診断用） */
export async function getAllEntries(uid: string): Promise<DailyEntry[]> {
  const entriesRef = collection(db, "users", uid, "entries");
  const q = query(entriesRef, orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      date: data.date ?? "",
      valence: data.valence ?? 0,
      arousal: data.arousal ?? 0,
      valenceAnswers: data.valenceAnswers ?? [],
      arousalAnswers: data.arousalAnswers ?? [],
      activities: data.activities ?? [],
      freeText: data.freeText ?? "",
      createdAt: data.createdAt,
    } as DailyEntry;
  });
}

/** 期間指定でエントリーを取得（日付昇順） */
export async function getEntriesByDateRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const entriesRef = collection(db, "users", uid, "entries");
  const q = query(
    entriesRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      date: data.date ?? "",
      valence: data.valence ?? 0,
      arousal: data.arousal ?? 0,
      valenceAnswers: data.valenceAnswers ?? [],
      arousalAnswers: data.arousalAnswers ?? [],
      activities: data.activities ?? [],
      freeText: data.freeText ?? "",
      createdAt: data.createdAt,
    } as DailyEntry;
  });
}

/** ユーザーの直近のエントリーを取得 */
export async function getRecentEntries(
  uid: string,
  maxCount = 30
): Promise<DailyEntry[]> {
  const entriesRef = collection(db, "users", uid, "entries");
  const q = query(
    entriesRef,
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      date: data.date ?? "",
      valence: data.valence ?? 0,
      arousal: data.arousal ?? 0,
      valenceAnswers: data.valenceAnswers ?? [],
      arousalAnswers: data.arousalAnswers ?? [],
      activities: data.activities ?? [],
      freeText: data.freeText ?? "",
      createdAt: data.createdAt,
    } as DailyEntry;
  });
}
