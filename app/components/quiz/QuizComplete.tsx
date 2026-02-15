import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getEmotionLabel } from "~/lib/quiz-questions";

interface Props {
  valence: number;
  arousal: number;
  saveError?: string | null;
  onClose: () => void;
}

export function QuizComplete({
  valence,
  arousal,
  saveError,
  onClose,
}: Props) {
  const label = getEmotionLabel(valence, arousal);

  // 円環上の位置を計算 (SVG座標: 中心150,150 半径120)
  const cx = 150;
  const cy = 150;
  const r = 110;
  const dotX = cx + valence * r;
  const dotY = cy - arousal * r; // SVGのY軸は反転

  return (
    <div className="space-y-5 animate-slide-up">
      <h2 className="text-xl font-bold text-center">記録完了!</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-base">
            今日の感情: {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {/* 感情円環モデル */}
          <svg viewBox="0 0 300 300" className="w-56 h-56">
            {/* 背景円 */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeWidth={1.5}
            />
            {/* 軸線 */}
            <line
              x1={cx - r}
              y1={cy}
              x2={cx + r}
              y2={cy}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <line
              x1={cx}
              y1={cy - r}
              x2={cx}
              y2={cy + r}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            {/* 軸ラベル */}
            <text
              x={cx + r + 5}
              y={cy + 4}
              fontSize={10}
              fill="currentColor"
              opacity={0.45}
            >
              快
            </text>
            <text
              x={cx - r - 18}
              y={cy + 4}
              fontSize={10}
              fill="currentColor"
              opacity={0.45}
            >
              不快
            </text>
            <text
              x={cx - 6}
              y={cy - r - 8}
              fontSize={10}
              fill="currentColor"
              opacity={0.45}
            >
              活性
            </text>
            <text
              x={cx - 12}
              y={cy + r + 16}
              fontSize={10}
              fill="currentColor"
              opacity={0.45}
            >
              不活性
            </text>
            {/* 感情象限ラベル */}
            <text
              x={cx + 30}
              y={cy - 40}
              fontSize={9}
              fill="currentColor"
              opacity={0.25}
            >
              興奮・喜び
            </text>
            <text
              x={cx + 30}
              y={cy + 50}
              fontSize={9}
              fill="currentColor"
              opacity={0.25}
            >
              穏やか・満足
            </text>
            <text
              x={cx - 85}
              y={cy - 40}
              fontSize={9}
              fill="currentColor"
              opacity={0.25}
            >
              怒り・緊張
            </text>
            <text
              x={cx - 85}
              y={cy + 50}
              fontSize={9}
              fill="currentColor"
              opacity={0.25}
            >
              悲しみ・倦怠
            </text>
            {/* ドット with glow */}
            <circle cx={dotX} cy={dotY} r={14} fill="oklch(0.55 0.2 265)" opacity={0.15} />
            <circle cx={dotX} cy={dotY} r={8} fill="oklch(0.55 0.2 265)" opacity={0.9} />
            <circle cx={dotX} cy={dotY} r={3.5} fill="white" />
          </svg>
          <div className="text-xs text-muted-foreground text-center space-y-0.5">
            <p>
              Valence (快・不快): {valence > 0 ? "+" : ""}
              {valence.toFixed(2)}
            </p>
            <p>
              Arousal (活性): {arousal > 0 ? "+" : ""}
              {arousal.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
      {saveError && (
        <p className="text-sm text-destructive glass-subtle p-3 rounded-xl">
          保存に失敗しました: {saveError}
        </p>
      )}
      <Button onClick={onClose} className="w-full" size="lg">
        ダッシュボードへ
      </Button>
    </div>
  );
}
