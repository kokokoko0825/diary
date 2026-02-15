import { Textarea } from "~/components/ui/textarea";
import type { QuizQuestion } from "~/lib/quiz-questions";

interface Props {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
}

export function TextQuestion({ question, value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-center leading-snug">{question.question}</h2>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ここに自由に書いてください..."
        rows={5}
        className="resize-none"
      />
    </div>
  );
}
