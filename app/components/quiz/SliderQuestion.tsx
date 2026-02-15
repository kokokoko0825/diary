import { Slider } from "~/components/ui/slider";
import type { QuizQuestion } from "~/lib/quiz-questions";

interface Props {
  question: QuizQuestion;
  value: number;
  onChange: (value: number) => void;
}

export function SliderQuestion({ question, value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-center leading-snug">{question.question}</h2>
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={-100}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span>{question.minLabel}</span>
          <span className="font-medium text-foreground text-sm">
            {value > 0 ? "+" : ""}
            {(value / 100).toFixed(2)}
          </span>
          <span>{question.maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
