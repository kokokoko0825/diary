import type { Timestamp } from "firebase/firestore";

/** コレクション: users/{uid} */
export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
}

/** サブコレクション: users/{uid}/entries/{entryId} */
export interface DailyEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  valence: number; // -1.0 ~ 1.0 (快・不快)
  arousal: number; // -1.0 ~ 1.0 (活性・不活性)
  valenceAnswers: number[]; // 各質問の生回答
  arousalAnswers: number[]; // 各質問の生回答
  activities: string[]; // 活動タグ
  freeText: string; // 自由記述
  createdAt: Timestamp;
}
