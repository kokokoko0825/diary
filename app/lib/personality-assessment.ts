import type { DailyEntry } from "~/types/firestore";

// ── 統計ユーティリティ ──

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/** 平均二乗連続差 — 日間の不安定性指標 (Jahng et al., 2008) */
function mssd(arr: number[]): number {
  if (arr.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < arr.length; i++) {
    sum += (arr[i] - arr[i - 1]) ** 2;
  }
  return sum / (arr.length - 1);
}

/** Lag-1 自己相関 — 感情の慣性 (Kuppens et al., 2010) */
function autocorrelation(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  let num = 0;
  let den = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    num += (arr[i] - m) * (arr[i + 1] - m);
  }
  for (let i = 0; i < arr.length; i++) {
    den += (arr[i] - m) ** 2;
  }
  if (den === 0) return 0;
  return num / den;
}

// ── 活動パターン抽出 ──

interface ActivityPatterns {
  /** 社交頻度 (0-1): 「たくさん」「少し」の割合 */
  socialFrequency: number;
  /** 新規活動率 (0-1): 「はい」の割合 */
  noveltyRate: number;
  /** 平均睡眠の質 (0-1): 1-5を0-1に正規化 */
  sleepQuality: number;
  /** 運動頻度 (0-1): 運動を選択した日の割合 */
  exerciseFrequency: number;
  /** 活動多様性 (0-1): ユニーク活動数 / 最大活動種類数 */
  activityDiversity: number;
}

function extractActivityPatterns(entries: DailyEntry[]): ActivityPatterns {
  if (entries.length === 0) {
    return {
      socialFrequency: 0.5,
      noveltyRate: 0.5,
      sleepQuality: 0.5,
      exerciseFrequency: 0.5,
      activityDiversity: 0.5,
    };
  }

  let socialCount = 0;
  let noveltyCount = 0;
  let sleepSum = 0;
  let sleepEntries = 0;
  let exerciseCount = 0;
  const allActivities = new Set<string>();

  for (const entry of entries) {
    const acts = entry.activities;

    // 社交: 「たくさん」or「少し」→ 社交あり
    if (acts.includes("たくさん") || acts.includes("少し")) {
      socialCount++;
    }

    // 新規活動
    if (acts.includes("はい")) {
      noveltyCount++;
    }

    // 睡眠の質 (activity-3 の値が "1"-"5" として保存)
    for (const a of acts) {
      const sleepVal = Number(a);
      if (!Number.isNaN(sleepVal) && sleepVal >= 1 && sleepVal <= 5) {
        sleepSum += sleepVal;
        sleepEntries++;
      }
    }

    // 運動
    if (acts.includes("運動")) {
      exerciseCount++;
    }

    // 活動多様性 (主な活動カテゴリのみ)
    const mainActs = ["仕事", "学習", "運動", "家事", "買い物", "睡眠"];
    for (const a of acts) {
      if (mainActs.includes(a)) {
        allActivities.add(a);
      }
    }
  }

  const n = entries.length;
  const maxCategories = 6; // 主な活動の種類数

  return {
    socialFrequency: socialCount / n,
    noveltyRate: noveltyCount / n,
    sleepQuality: sleepEntries > 0 ? (sleepSum / sleepEntries - 1) / 4 : 0.5,
    exerciseFrequency: exerciseCount / n,
    activityDiversity: allActivities.size / maxCategories,
  };
}

// ── Affect Dynamics Parameters ──

interface ADP {
  valenceMean: number;
  valenceSD: number;
  valenceMSSD: number;
  valenceAutocorr: number;
  arousalMean: number;
  arousalSD: number;
  arousalMSSD: number;
  arousalAutocorr: number;
}

function computeADP(entries: DailyEntry[]): ADP {
  const valences = entries.map((e) => e.valence);
  const arousals = entries.map((e) => e.arousal);

  return {
    valenceMean: mean(valences),
    valenceSD: stddev(valences),
    valenceMSSD: mssd(valences),
    valenceAutocorr: autocorrelation(valences),
    arousalMean: mean(arousals),
    arousalSD: stddev(arousals),
    arousalMSSD: mssd(arousals),
    arousalAutocorr: autocorrelation(arousals),
  };
}

// ── Big Five 推定 ──

export interface BigFiveScores {
  neuroticism: number; // 0-100
  extraversion: number;
  conscientiousness: number;
  agreeableness: number;
  openness: number;
}

export interface TraitDetail {
  key: keyof BigFiveScores;
  label: string;
  labelEn: string;
  score: number;
  description: string;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface PersonalityResult {
  scores: BigFiveScores;
  traits: TraitDetail[];
  confidence: ConfidenceLevel;
  entryCount: number;
  periodDays: number;
}

/** 0-1 の範囲にクランプ */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** -1~1 の値を 0~1 に正規化 */
function normalize(v: number): number {
  return (v + 1) / 2;
}

function getTraitDescription(key: keyof BigFiveScores, score: number): string {
  const descriptions: Record<keyof BigFiveScores, [string, string, string]> = {
    neuroticism: [
      "感情的に安定しており、ストレスに対して強い耐性があります。冷静に物事を判断できる傾向があります。",
      "感情の波は一般的な範囲内です。状況に応じて適度にストレスを感じますが、バランスよく対処できています。",
      "感情の変動が大きく、繊細に物事を感じ取る傾向があります。この感受性は創造性や共感力の源でもあります。",
    ],
    extraversion: [
      "内向的で、一人の時間やじっくりと考えることを好む傾向があります。深い思考や集中力が強みです。",
      "内向と外向のバランスが取れています。社交的な場面も一人の時間も楽しめる柔軟性があります。",
      "外向的で、活動的な生活を送っています。人との交流やエネルギッシュな活動から活力を得ています。",
    ],
    conscientiousness: [
      "柔軟で自由な生活スタイルを好みます。型にはまらない発想で物事に取り組む傾向があります。",
      "計画性と柔軟性のバランスが取れています。必要に応じて規律正しくも自由にも行動できます。",
      "自己管理能力が高く、規律正しい生活リズムを維持しています。安定した感情パターンがその証拠です。",
    ],
    agreeableness: [
      "独立心が強く、自分の考えをしっかり持っています。客観的で分析的な視点が強みです。",
      "協調性と自主性のバランスが取れています。状況に応じて他者と協力しつつ、自分の意見も持てます。",
      "他者への共感力が高く、良好な対人関係を築く傾向があります。社交場面でポジティブな感情を維持できます。",
    ],
    openness: [
      "安定した環境や慣れた方法を好む傾向があります。確実性を重視し、着実に物事を進めます。",
      "新しい体験と安定のバランスが取れています。適度に新しいことに挑戦しつつ、慣れた方法も活用します。",
      "新しい経験や活動に積極的に取り組んでいます。多様な活動への関与が好奇心の強さを示しています。",
    ],
  };

  const [low, mid, high] = descriptions[key];
  if (score < 35) return low;
  if (score < 65) return mid;
  return high;
}

/**
 * Big Five 性格特性を推定する
 *
 * 科学的根拠:
 * - Kuppens et al. (2007): Neuroticism ↔ 負の感情平均・変動性
 * - Augustine & Larsen (2012): Extraversion ↔ 正の感情・覚醒度
 * - Segerstrom et al. (2003): Conscientiousness ↔ 感情安定性
 * - Fleeson (2001): Openness ↔ 幅広い感情経験・新規活動
 */
export function assessPersonality(entries: DailyEntry[]): PersonalityResult {
  // 日付順にソート
  const sorted = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  const adp = computeADP(sorted);
  const patterns = extractActivityPatterns(sorted);

  // valence/arousal は -1~1 の範囲なので、SDの最大値は約1.0、MSSは約4.0
  const maxSD = 1.0;
  const maxMSSD = 2.0; // 実用的な最大値

  // ── Neuroticism ──
  // 高い負の感情 + 高い変動性 + 高い不安定性 + 低い睡眠の質
  const negValence = clamp01(1 - normalize(adp.valenceMean)); // 負の感情が多いほど高い
  const valenceVariability = clamp01(adp.valenceSD / maxSD);
  const valenceInstability = clamp01(adp.valenceMSSD / maxMSSD);
  const poorSleep = clamp01(1 - patterns.sleepQuality);
  const neuroticism =
    negValence * 0.4 +
    valenceVariability * 0.3 +
    valenceInstability * 0.2 +
    poorSleep * 0.1;

  // ── Extraversion ──
  // 高い正の感情 + 高い覚醒度 + 社交頻度 + 活動多様性
  const posValence = clamp01(normalize(adp.valenceMean));
  const highArousal = clamp01(normalize(adp.arousalMean));
  const extraversion =
    posValence * 0.35 +
    highArousal * 0.25 +
    patterns.socialFrequency * 0.25 +
    patterns.activityDiversity * 0.15;

  // ── Conscientiousness ──
  // 低い感情変動 + 低い覚醒変動 + 高い睡眠の質 + 感情バランス
  const valenceStability = clamp01(1 - adp.valenceSD / maxSD);
  const arousalStability = clamp01(1 - adp.arousalSD / maxSD);
  const emotionalBalance = clamp01(1 - Math.abs(adp.valenceMean)); // 極端でないほど高い
  const conscientiousness =
    valenceStability * 0.3 +
    arousalStability * 0.25 +
    patterns.sleepQuality * 0.25 +
    emotionalBalance * 0.2;

  // ── Agreeableness ──
  // 正の感情 + 社交頻度 + 覚醒安定性 + 感情安定性
  const agreeableness =
    posValence * 0.4 +
    patterns.socialFrequency * 0.3 +
    arousalStability * 0.2 +
    valenceStability * 0.1;

  // ── Openness ──
  // 活動多様性 + 新規活動率 + 覚醒変動(多様な体験) + 運動頻度
  const arousalVariability = clamp01(adp.arousalSD / maxSD);
  const openness =
    patterns.activityDiversity * 0.35 +
    patterns.noveltyRate * 0.3 +
    arousalVariability * 0.2 +
    patterns.exerciseFrequency * 0.15;

  // 0-1 → 0-100 に変換
  const scores: BigFiveScores = {
    neuroticism: Math.round(neuroticism * 100),
    extraversion: Math.round(extraversion * 100),
    conscientiousness: Math.round(conscientiousness * 100),
    agreeableness: Math.round(agreeableness * 100),
    openness: Math.round(openness * 100),
  };

  const traits: TraitDetail[] = [
    {
      key: "openness",
      label: "開放性",
      labelEn: "Openness",
      score: scores.openness,
      description: getTraitDescription("openness", scores.openness),
    },
    {
      key: "conscientiousness",
      label: "誠実性",
      labelEn: "Conscientiousness",
      score: scores.conscientiousness,
      description: getTraitDescription("conscientiousness", scores.conscientiousness),
    },
    {
      key: "extraversion",
      label: "外向性",
      labelEn: "Extraversion",
      score: scores.extraversion,
      description: getTraitDescription("extraversion", scores.extraversion),
    },
    {
      key: "agreeableness",
      label: "協調性",
      labelEn: "Agreeableness",
      score: scores.agreeableness,
      description: getTraitDescription("agreeableness", scores.agreeableness),
    },
    {
      key: "neuroticism",
      label: "神経症傾向",
      labelEn: "Neuroticism",
      score: scores.neuroticism,
      description: getTraitDescription("neuroticism", scores.neuroticism),
    },
  ];

  // 期間と信頼度
  const firstDate = sorted[0]?.date ?? "";
  const lastDate = sorted[sorted.length - 1]?.date ?? "";
  const periodDays =
    firstDate && lastDate
      ? Math.ceil(
          (new Date(lastDate).getTime() - new Date(firstDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  let confidence: ConfidenceLevel;
  if (sorted.length >= 30 && periodDays >= 30) {
    confidence = "high";
  } else if (sorted.length >= 14) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    scores,
    traits,
    confidence,
    entryCount: sorted.length,
    periodDays,
  };
}

/** 診断に必要な最低日数 */
export const MIN_ENTRIES = 7;
