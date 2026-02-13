import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import type { QuizQuestion } from "~/lib/quiz-questions";

interface Props {
  question: QuizQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxQuestion({ question, value, onChange }: Props) {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">{question.question}</h2>
      <div className="space-y-3">
        {question.options?.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => toggle(option.value)}
          >
            <Checkbox
              checked={value.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
              id={option.value}
            />
            <Label htmlFor={option.value} className="cursor-pointer flex-1">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
