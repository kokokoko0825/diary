import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import type { QuizQuestion } from "~/lib/quiz-questions";

interface Props {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
}

export function RadioQuestion({ question, value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-center leading-snug">{question.question}</h2>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-2.5">
        {question.options?.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-3 glass-subtle rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => onChange(option.value)}
          >
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value} className="cursor-pointer flex-1 text-sm">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
