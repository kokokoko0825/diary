export type QuestionType = "slider" | "radio" | "checkbox" | "text";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  /** スライダーの場合の左ラベル */
  minLabel?: string;
  /** スライダーの場合の右ラベル */
  maxLabel?: string;
  /** ラジオ/チェックボックスの選択肢 */
  options?: QuestionOption[];
  /** 感情カテゴリ */
  category: "valence" | "arousal" | "activity" | "freetext";
}

export const quizQuestions: QuizQuestion[] = [
  // 感情測定: Valence (3問)
  {
    id: "valence-1",
    type: "slider",
    question: "今日一日を通しての気分はどちらに近いですか？",
    minLabel: "とても嫌な一日だった",
    maxLabel: "とても良い一日だった",
    category: "valence",
  },
  {
    id: "valence-2",
    type: "radio",
    question: "今日、「うれしい・楽しい・満足」と感じる瞬間はどのくらいありましたか？",
    options: [
      { label: "まったくなかった", value: "1" },
      { label: "ほとんどなかった", value: "2" },
      { label: "ときどきあった", value: "3" },
      { label: "よくあった", value: "4" },
      { label: "たくさんあった", value: "5" },
    ],
    category: "valence",
  },
  {
    id: "valence-3",
    type: "radio",
    question: "今日、「不安・イライラ・落ち込み」と感じる瞬間はどのくらいありましたか？",
    options: [
      { label: "まったくなかった", value: "1" },
      { label: "ほとんどなかった", value: "2" },
      { label: "ときどきあった", value: "3" },
      { label: "よくあった", value: "4" },
      { label: "たくさんあった", value: "5" },
    ],
    category: "valence",
  },
  // 感情測定: Arousal (3問 + 行動)
  {
    id: "arousal-1",
    type: "slider",
    question: "今日はどちらかというと、落ち着いていましたか？それともそわそわ・高ぶっていましたか？",
    minLabel: "とても落ち着いていた",
    maxLabel: "とてもそわそわ・高ぶっていた",
    category: "arousal",
  },
  {
    id: "arousal-2",
    type: "radio",
    question: "今日はどのくらい活動的でしたか？",
    options: [
      { label: "まったく", value: "1" },
      { label: "少し", value: "2" },
      { label: "ふつう", value: "3" },
      { label: "よく", value: "4" },
      { label: "非常に", value: "5" },
    ],
    category: "arousal",
  },
  {
    id: "arousal-3",
    type: "slider",
    question: "今の体と心の元気さはどのくらいですか？",
    minLabel: "まったく力が出ない",
    maxLabel: "とてもエネルギッシュ",
    category: "arousal",
  },
  // 活動タグ (5問) — 値は personality-assessment のために維持
  {
    id: "activity-1",
    type: "checkbox",
    question: "今日の主な活動は？（複数選択可）",
    options: [
      { label: "仕事", value: "仕事" },
      { label: "学習", value: "学習" },
      { label: "運動", value: "運動" },
      { label: "家事", value: "家事" },
      { label: "買い物", value: "買い物" },
      { label: "睡眠", value: "睡眠" },
    ],
    category: "activity",
  },
  {
    id: "activity-2",
    type: "radio",
    question: "食事はどうでしたか？",
    options: [
      { label: "しっかり食べた", value: "しっかり食べた" },
      { label: "普通", value: "普通" },
      { label: "あまり食べなかった", value: "あまり食べなかった" },
      { label: "食べなかった", value: "食べなかった" },
    ],
    category: "activity",
  },
  {
    id: "activity-3",
    type: "radio",
    question: "睡眠の質は？",
    options: [
      { label: "最悪", value: "1" },
      { label: "悪い", value: "2" },
      { label: "普通", value: "3" },
      { label: "良い", value: "4" },
      { label: "最高", value: "5" },
    ],
    category: "activity",
  },
  {
    id: "activity-4",
    type: "radio",
    question: "人と交流しましたか？",
    options: [
      { label: "たくさん", value: "たくさん" },
      { label: "少し", value: "少し" },
      { label: "ほとんどなし", value: "ほとんどなし" },
      { label: "まったくなし", value: "まったくなし" },
    ],
    category: "activity",
  },
  {
    id: "activity-5",
    type: "radio",
    question: "新しいことに挑戦しましたか？",
    options: [
      { label: "はい", value: "はい" },
      { label: "いいえ", value: "いいえ" },
    ],
    category: "activity",
  },
  // 自由記述 (1問)
  {
    id: "freetext-1",
    type: "text",
    question: "日記",
    category: "freetext",
  },
];

/**
 * クイズ回答から Valence/Arousal を算出
 *
 * - スライダー: -100~100 を -1.0~1.0 に変換 (value / 100)
 * - 5段階: 1~5 を -1.0~1.0 にマッピング → (value - 3) / 2
 * - Arousal には一部の活動質問（睡眠の質・人との交流・新しいことへの挑戦）も反映する
 */
export function calculateValenceArousal(answers: Record<string, unknown>) {
  // Valence components
  const rawSliderValence = (answers["valence-1"] as number) ?? 0;
  const sliderValence = rawSliderValence / 100;

  const rawV2 = Number(answers["valence-2"]);
  const valence2 = Number.isNaN(rawV2) ? null : (rawV2 - 3) / 2;

  const rawV3 = Number(answers["valence-3"]);
  // ネガティブ感情の頻度: 少ない(1)→+1, 多い(5)→-1 のため (3-value)/2
  const valence3 = Number.isNaN(rawV3) ? null : (3 - rawV3) / 2;

  const valenceComponents: number[] = [sliderValence];
  if (valence2 !== null) valenceComponents.push(valence2);
  if (valence3 !== null) valenceComponents.push(valence3);

  const valence =
    valenceComponents.length > 0
      ? valenceComponents.reduce((sum, v) => sum + v, 0) / valenceComponents.length
      : 0;

  // Arousal components (主観)
  const rawSliderArousal1 = (answers["arousal-1"] as number) ?? 0;
  const sliderArousal1 = rawSliderArousal1 / 100;

  const rawA2 = Number(answers["arousal-2"]);
  const arousal2 = Number.isNaN(rawA2) ? null : (rawA2 - 3) / 2;

  const rawSliderArousal3 = (answers["arousal-3"] as number) ?? 0;
  const sliderArousal3 = rawSliderArousal3 / 100;

  const arousalComponents: number[] = [sliderArousal1, sliderArousal3];
  if (arousal2 !== null) arousalComponents.push(arousal2);

  // Arousal components (行動: 睡眠の質)
  const rawSleep = Number(answers["activity-3"]);
  let sleepComponent: number | null = null;
  if (!Number.isNaN(rawSleep) && rawSleep >= 1 && rawSleep <= 5) {
    sleepComponent = (rawSleep - 3) / 2;
    arousalComponents.push(sleepComponent);
  }

  // Arousal components (行動: 人との交流)
  const socialRaw = answers["activity-4"];
  const socialMap: Record<string, number> = {
    "まったくなし": -1,
    "ほとんどなし": -0.5,
    "少し": 0,
    "たくさん": 1,
  };
  let socialComponent: number | null = null;
  if (typeof socialRaw === "string" && socialRaw in socialMap) {
    socialComponent = socialMap[socialRaw];
    arousalComponents.push(socialComponent);
  }

  // Arousal components (行動: 新しいことへの挑戦)
  const noveltyRaw = answers["activity-5"];
  let noveltyComponent: number | null = null;
  if (noveltyRaw === "はい") {
    noveltyComponent = 0.5;
    arousalComponents.push(noveltyComponent);
  }

  const arousal =
    arousalComponents.length > 0
      ? arousalComponents.reduce((sum, v) => sum + v, 0) / arousalComponents.length
      : 0;

  return {
    valence: Math.round(valence * 100) / 100,
    arousal: Math.round(arousal * 100) / 100,
    // 生回答と正規化済みの一部を記録（将来の分析用）
    valenceAnswers: [sliderValence, rawV2, rawV3].filter(
      (v): v is number => typeof v === "number" && !Number.isNaN(v),
    ),
    arousalAnswers: [
      sliderArousal1,
      rawA2,
      sliderArousal3,
      rawSleep,
      socialComponent,
      noveltyComponent,
    ].filter((v): v is number => typeof v === "number" && !Number.isNaN(v)),
  };
}

/** ラッセル感情円環モデル上の感情ラベルを取得 */
export function getEmotionLabel(valence: number, arousal: number): string {
  if (valence > 0.3 && arousal > 0.3) return "興奮・喜び";
  if (valence > 0.3 && arousal < -0.3) return "穏やか・満足";
  if (valence < -0.3 && arousal > 0.3) return "怒り・緊張";
  if (valence < -0.3 && arousal < -0.3) return "悲しみ・倦怠";
  if (valence > 0.3) return "幸福";
  if (valence < -0.3) return "不快";
  if (arousal > 0.3) return "覚醒";
  if (arousal < -0.3) return "沈静";
  return "ニュートラル";
}

/** 回答から活動タグを収集 */
export function collectActivities(answers: Record<string, unknown>): string[] {
  const tags: string[] = [];

  // チェックボックス (配列)
  const mainActivities = answers["activity-1"];
  if (Array.isArray(mainActivities)) {
    tags.push(...mainActivities);
  }

  // ラジオ (文字列)
  for (const key of [
    "activity-2",
    "activity-3",
    "activity-4",
    "activity-5",
  ]) {
    const val = answers[key];
    if (typeof val === "string" && val) {
      tags.push(val);
    }
  }

  return tags;
}
