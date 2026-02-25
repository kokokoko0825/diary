const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CUTOFF_HOUR_LOCAL = 3;
const JST_TIME_ZONE = "Asia/Tokyo";

/**
 * JST(Asia/Tokyo) を基準に AM3:00 までは前日扱いとした「日付」を "YYYY-MM-DD" 形式で返す
 */
export function getDiaryDateUtc3(now: Date = new Date()): string {
  // `now` を JST のローカル時刻に変換
  const jst = new Date(now.toLocaleString("en-US", { timeZone: JST_TIME_ZONE }));

  if (jst.getHours() < CUTOFF_HOUR_LOCAL) {
    jst.setDate(jst.getDate() - 1);
  }

  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const d = String(jst.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/**
 * JST 基準 AM3:00 締めの論理日付に基づき、指定日数分の開始日・終了日を返す
 */
export function getDiaryRangeUtc3(
  days: number,
  now: Date = new Date()
): { startDate: string; endDate: string } {
  const endDate = getDiaryDateUtc3(now);
  const startBase = new Date(now.getTime() - days * MS_PER_DAY);
  const startDate = getDiaryDateUtc3(startBase);

  return { startDate, endDate };
}
