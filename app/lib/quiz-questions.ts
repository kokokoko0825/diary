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
  // 感情測定: Valence (2問)
  {
    id: "valence-1",
    type: "slider",
    question: "今日の気分はどちらに近いですか？",
    minLabel: "不快",
    maxLabel: "快",
    category: "valence",
  },
  {
    id: "valence-2",
    type: "radio",
    question: "今日、ポジティブな感情を感じましたか？",
    options: [
      { label: "まったく", value: "1" },
      { label: "少し", value: "2" },
      { label: "ふつう", value: "3" },
      { label: "かなり", value: "4" },
      { label: "とても", value: "5" },
    ],
    category: "valence",
  },
  // 感情測定: Arousal (2問)
  {
    id: "arousal-1",
    type: "slider",
    question: "今の気持ちは落ち着いていますか？それとも高ぶっていますか？",
    minLabel: "落ち着いている",
    maxLabel: "高ぶっている",
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
      { label: "かなり", value: "4" },
      { label: "とても", value: "5" },
    ],
    category: "arousal",
  },
  // 活動タグ (5問)
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
 * スライダー: -100~100 を -1.0~1.0 に変換 (value / 100)
 * 5段階: 1~5 を -1.0~1.0 にマッピング → (value - 3) / 2
 */
export function calculateValenceArousal(answers: Record<string, unknown>) {
  const rawSliderValence = (answers["valence-1"] as number) ?? 0;
  const sliderValence = rawSliderValence / 100;
  const v2 = Number(answers["valence-2"]);
  const radioValence = Number.isNaN(v2) ? 0 : (v2 - 3) / 2;
  const valence = (sliderValence + radioValence) / 2;

  const rawSliderArousal = (answers["arousal-1"] as number) ?? 0;
  const sliderArousal = rawSliderArousal / 100;
  const a2 = Number(answers["arousal-2"]);
  const radioArousal = Number.isNaN(a2) ? 0 : (a2 - 3) / 2;
  const arousal = (sliderArousal + radioArousal) / 2;

  return {
    valence: Math.round(valence * 100) / 100,
    arousal: Math.round(arousal * 100) / 100,
    valenceAnswers: [sliderValence, v2],
    arousalAnswers: [sliderArousal, a2],
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
