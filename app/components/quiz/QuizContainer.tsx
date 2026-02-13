import { useState } from "react";
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
import { saveDailyEntry } from "~/lib/firestore";
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

  const totalSteps = quizQuestions.length;
  const currentQuestion = quizQuestions[step];
  const isComplete = result !== null;

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
      // 全問完了 → 計算して保存
      setSaving(true);
      try {
        const { valence, arousal, valenceAnswers, arousalAnswers } =
          calculateValenceArousal(answers);
        const activities = collectActivities(answers);
        const freeText = (answers["freetext-1"] as string) ?? "";

        if (user && user !== "loading") {
          await saveDailyEntry(user.uid, {
            date: new Date().toISOString().split("T")[0],
            valence,
            arousal,
            valenceAnswers,
            arousalAnswers,
            activities,
            freeText,
          });
        }

        setResult({ valence, arousal });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (isComplete) {
    return (
      <QuizComplete
        valence={result.valence}
        arousal={result.arousal}
        onClose={() => navigate("/app/dashboard")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
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
        >
          戻る
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="flex-1"
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
