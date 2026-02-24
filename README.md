# MoodLog (diary)

気分・日記を記録し、ダッシュボードで可視化するWebアプリ。記録データをもとにした性格診断機能あり。

## 主な機能

- **記録（Quiz）**: 快・不快（valence）と活性度（arousal）の質問に回答し、活動タグと自由記述で日々の記録を保存
- **ダッシュボード**: 期間指定で気分推移をグラフ表示（Recharts）
- **性格診断**: 蓄積したエントリーから性格傾向を表示
- **日記エントリー**: 日付ごとの記録の閲覧・編集
- **認証**: Firebase Authentication（要ログイン）
- **通知**: Firebase Cloud Messaging / Functions によるリマインダー（22:00、設定でON/OFF）

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロント | React 19, React Router 7, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts |
| BaaS | Firebase（Auth, Firestore, Hosting, Functions） |
| パッケージ | pnpm |

## 前提条件

- Node.js 20
- pnpm（`corepack enable` の上で `pnpm` を使用）
- Firebase プロジェクト（Auth, Firestore, Cloud Messaging 有効）

## セットアップ

```bash
git clone https://github.com/kokokoko0825/diary.git
cd diary
pnpm install
```

Firebase の設定は環境変数で行う。`.env.local` に以下を用意する（値は Firebase コンソールから取得）。

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`（Push 通知用）

## 開発

```bash
pnpm dev
```

`http://localhost:5173` で起動。

## ビルド

```bash
pnpm run build
```

出力は `build/client`（静的アセット）と `build/server`（SSR用）。

## デプロイ

- **Firebase Hosting**: `build/client` をホスティング。`main` への push で GitHub Actions がビルド後に Firebase へデプロイする。
- **Firebase Functions**: `functions/` を別途デプロイ。Functions デプロイの権限・API 設定は [docs/DEPLOY_SETUP.md](docs/DEPLOY_SETUP.md) を参照。

### Docker（任意）

```bash
docker build -t diary .
docker run -p 3000:3000 diary
```

## ドキュメント

- [Firebase Functions デプロイの権限設定](docs/DEPLOY_SETUP.md)

## ライセンス

Private repository.
