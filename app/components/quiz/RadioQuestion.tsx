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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">{question.question}</h2>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {question.options?.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onChange(option.value)}
          >
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value} className="cursor-pointer flex-1">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
