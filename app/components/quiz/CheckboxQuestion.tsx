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
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-center leading-snug">{question.question}</h2>
      <div className="space-y-2.5">
        {question.options?.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-3 glass-subtle rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => toggle(option.value)}
          >
            <Checkbox
              checked={value.includes(option.value)}
              className="pointer-events-none"
            />
            <span className="cursor-pointer flex-1 text-sm">
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
