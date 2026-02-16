import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Card, CardContent } from "~/components/ui/card";
import { SliderQuestion } from "./SliderQuestion";
import { RadioQuestion } from "./RadioQuestion";
import { CheckboxQuestion } from "./CheckboxQuestion";
import { TextQuestion } from "./TextQuestion";
import { QuizComplete } from "./QuizComplete";
import {
  quizQuestions,
  calculateValenceArousal,
  collectActivities,
} from "~/lib/quiz-questions";
import { saveDailyEntry, hasEntryForDate } from "~/lib/firestore";
import { getTodayJST } from "~/lib/date";
import { useAuth } from "~/contexts/auth";

export function QuizContainer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{
    valence: number;
    arousal: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user || user === "loading") return;
    const today = getTodayJST();
    hasEntryForDate(user.uid, today)
      .then((exists) => setAlreadyRecorded(exists))
      .finally(() => setChecking(false));
  }, [user]);

  const totalSteps = quizQuestions.length;
  const currentQuestion = quizQuestions[step];
  const isComplete = result !== null;

  // クリック時に最新の answers を参照するため ref に同期
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const setAnswer = (value: unknown) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const currentAnswer = answers[currentQuestion?.id];

  const canProceed = (() => {
    if (!currentQuestion) return false;
    switch (currentQuestion.type) {
      case "slider":
        return true; // スライダーは常に値がある
      case "radio":
        return typeof currentAnswer === "string" && currentAnswer !== "";
      case "checkbox":
        return Array.isArray(currentAnswer) && currentAnswer.length > 0;
      case "text":
        return true; // 自由記述は任意
    }
  })();

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // 全問完了 → 計算して保存（ref から最新の answers を取得）
      setSaving(true);
      setSaveError(null);
      const latestAnswers = answersRef.current;

      try {
        const { valence, arousal, valenceAnswers, arousalAnswers } =
          calculateValenceArousal(latestAnswers);
        const activities = collectActivities(latestAnswers);
        const freeText = (latestAnswers["freetext-1"] as string) ?? "";

        if (user && user !== "loading") {
          await saveDailyEntry(user.uid, {
            date: getTodayJST(),
            valence,
            arousal,
            valenceAnswers,
            arousalAnswers,
            activities,
            freeText,
          });
        }

        setResult({ valence, arousal });
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "保存に失敗しました。"
        );
        // エラーでも結果は表示
        const { valence, arousal } = calculateValenceArousal(latestAnswers);
        setResult({ valence, arousal });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="glass rounded-2xl px-6 py-4">
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (alreadyRecorded) {
    return (
      <div className="space-y-5 animate-slide-up">
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-lg font-semibold">今日はもう記録済みです</p>
            <p className="text-sm text-muted-foreground">
              1日1回のみ記録できます。また明日記録しましょう。
            </p>
          </CardContent>
        </Card>
        <Button
          onClick={() => navigate("/app/dashboard")}
          className="w-full"
          size="lg"
        >
          ダッシュボードへ
        </Button>
      </div>
    );
  }

  if (isComplete && result) {
    return (
      <QuizComplete
        valence={result.valence}
        arousal={result.arousal}
        saveError={saveError}
        onClose={() => navigate("/app/dashboard")}
      />
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            質問 {step + 1} / {totalSteps}
          </span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / totalSteps) * 100} />
      </div>

      {/* 質問カード */}
      <Card>
        <CardContent className="pt-6">
          {currentQuestion.type === "slider" && (
            <SliderQuestion
              question={currentQuestion}
              value={typeof currentAnswer === "number" ? currentAnswer : 0}
              onChange={(v) => setAnswer(v)}
            />
          )}
          {currentQuestion.type === "radio" && (
            <RadioQuestion
              question={currentQuestion}
              value={typeof currentAnswer === "string" ? currentAnswer : ""}
              onChange={(v) => setAnswer(v)}
            />
          )}
          {currentQuestion.type === "checkbox" && (
            <CheckboxQuestion
              question={currentQuestion}
              value={Array.isArray(currentAnswer) ? currentAnswer : []}
              onChange={(v) => setAnswer(v)}
            />
          )}
          {currentQuestion.type === "text" && (
            <TextQuestion
              question={currentQuestion}
              value={typeof currentAnswer === "string" ? currentAnswer : ""}
              onChange={(v) => setAnswer(v)}
            />
          )}
        </CardContent>
      </Card>

      {/* ナビゲーション */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
          className="flex-1"
          size="lg"
        >
          戻る
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="flex-1"
          size="lg"
        >
          {saving
            ? "保存中..."
            : step === totalSteps - 1
              ? "完了"
              : "次へ"}
        </Button>
      </div>
    </div>
  );
}
