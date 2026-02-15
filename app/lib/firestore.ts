import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
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
