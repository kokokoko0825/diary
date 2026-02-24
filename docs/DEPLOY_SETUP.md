# Firebase デプロイの権限設定

GitHub Actions では **Hosting** と **Functions** の両方に同じサービスアカウント（`FIREBASE_SERVICE_ACCOUNT_MOODLOG_6297C`）を使います。

- **Hosting のデプロイが失敗する場合**: サービスアカウントに **Firebase Hosting Admin**（`roles/firebasehosting.admin`）を付与する。
- **Functions のデプロイが失敗する場合**: 以下に従って権限と API を設定する。

---

## 前提：サービスアカウントのメールアドレスを確認する

GitHub シークレット `FIREBASE_SERVICE_ACCOUNT_MOODLOG_6297C` に登録した JSON の **`client_email`** が、これから権限を付与するサービスアカウントです。

- 手元に JSON のコピーがある場合：`client_email` の値をメモする（例: `github-actions@moodlog-6297c.iam.gserviceaccount.com`）
- ない場合：[Google Cloud Console - サービスアカウント一覧](https://console.cloud.google.com/iam-admin/serviceaccounts?project=moodlog-6297c) を開き、GitHub 用に作成したサービスアカウントのメールアドレスを確認する

以下では、このメールアドレスを **「あなたの SA メール」** と表記します。

---

## 1. プロジェクトへのロール付与（Hosting + Functions で 7 ロール）

デプロイ用サービスアカウントに、プロジェクトに対する次の 7 ロールを付与します。

| ロール | 用途 |
|--------|------|
| Firebase Hosting Admin | Hosting のデプロイ（GitHub Actions の「Deploy to Firebase Hosting」ステップ） |
| Cloud Functions Developer | Functions のデプロイ・更新 |
| Cloud Scheduler Admin | スケジュール関数（sendDailyReminder）の作成・更新 |
| Service Account User | 実行時サービスアカウントの「使用」 |
| Firebase Extensions Viewer | Firebase 拡張機能の一覧取得（デプロイ時に必要） |
| Cloud Build Editor | Functions v2 のビルド実行 |
| Artifact Registry Writer | ビルドしたコンテナイメージのプッシュ |

### 方法 A：Google Cloud Console（画面で操作）

1. [IAM と管理 → IAM](https://console.cloud.google.com/iam-admin/iam?project=moodlog-6297c) を開く
2. 一覧から **「あなたの SA メール」** の行を探す
   - 見つからない場合：ページ上部の **「アクセス権を付与」** をクリックし、「新しいプリンシパル」に **「あなたの SA メール」** を入力
3. その行の **「編集」（鉛筆アイコン）** をクリック
4. **「別のロールを追加」** をクリックし、次の 7 ロールを 1 つずつ追加する：
   - `Firebase Hosting Admin`
   - `Cloud Functions Developer`
   - `Cloud Scheduler Admin`
   - `Service Account User`
   - `Firebase Extensions Viewer`
   - `Cloud Build Editor`
   - `Artifact Registry Writer`
5. **「保存」** をクリック

### 方法 B：gcloud コマンド（一括付与）

ターミナルで以下を実行します。`SA_EMAIL` を **「あなたの SA メール」** に置き換えてください。

```bash
PROJECT_ID="moodlog-6297c"
SA_EMAIL="あなたのSAメール"   # 例: github-actions@moodlog-6297c.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/firebasehosting.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudfunctions.developer" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudscheduler.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/firebaseextensions.viewer" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudbuild.builds.editor" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer" \
  --quiet
```

- `gcloud` 未設定の場合は [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) をインストールし、`gcloud auth login` と `gcloud config set project moodlog-6297c` を実行してから上記を実行してください。

---

## 2. デフォルト Compute サービスアカウントへの権限（必須）

`You do not have permission iam.serviceAccounts.ActAs` のようなエラーを防ぐため、**「あなたの SA メール」** に、プロジェクトのデフォルトの App Engine サービスアカウントを「使用」する権限を付与します。

### 方法 A：Google Cloud Console

1. [IAM と管理 → サービスアカウント](https://console.cloud.google.com/iam-admin/serviceaccounts?project=moodlog-6297c) を開く
2. 一覧から **`moodlog-6297c@appspot.gserviceaccount.com`**（App Engine のデフォルト サービスアカウント）の行をクリック
3. 上部の **「権限」** タブを開く
4. **「アクセス権を付与」** をクリック
5. **「新しいプリンシパル」** に **「あなたの SA メール」** を入力
6. **「ロール」** で **「Service Account User」**（サービス アカウント ユーザー）を選ぶ
7. **「保存」** をクリック

### 方法 B：gcloud コマンド

```bash
PROJECT_ID="moodlog-6297c"
SA_EMAIL="あなたのSAメール"
DEFAULT_SA="${PROJECT_ID}@appspot.gserviceaccount.com"

gcloud iam service-accounts add-iam-policy-binding $DEFAULT_SA \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --project=$PROJECT_ID
```

---

## 3. 必要な API の有効化

次の 4 つの API が有効になっている必要があります。

### 方法 A：Google Cloud Console

各リンクを開き、**「有効にする」** が表示されていればクリックして有効化する。すでに **「管理」** などだけの場合は有効済みです。

| API | リンク |
|-----|--------|
| Cloud Functions API | https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=moodlog-6297c |
| Cloud Scheduler API | https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?project=moodlog-6297c |
| Cloud Build API | https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=moodlog-6297c |
| Artifact Registry API | https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=moodlog-6297c |

### 方法 B：gcloud コマンド

```bash
PROJECT_ID="moodlog-6297c"

gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID
```

---

## 4. 設定の確認（任意）

- **IAM**
  - [IAM のメンバー一覧](https://console.cloud.google.com/iam-admin/iam?project=moodlog-6297c) で **「あなたの SA メール」** を検索し、上記 7 ロールが付いていることを確認
  - [サービスアカウント一覧](https://console.cloud.google.com/iam-admin/serviceaccounts?project=moodlog-6297c) で `moodlog-6297c@appspot.gserviceaccount.com` を開き、**「あなたの SA メール」** に「サービス アカウント ユーザー」が付いていることを確認
- **API**
  - [有効な API 一覧](https://console.cloud.google.com/apis/dashboard?project=moodlog-6297c) で、上記 4 API が「有効」になっていることを確認

---

## 5. デプロイの再実行

1. 上記 1〜3 をすべて実施したら、GitHub の [Actions タブ](https://github.com/kokokoko0825/diary/actions) を開く
2. 失敗しているワークフロー実行の **「Re-run all jobs」** をクリックするか、`main` に空のコミットを push して新しい実行を起こす
3. **「Deploy to Firebase Functions」** ステップが成功するか確認する

---

## よくあるエラーと対処

| エラー例 | 対処 |
|----------|------|
| `Permission denied` / `iam.serviceAccounts.ActAs` | **手順 2** を実施する（デフォルト SA への Service Account User） |
| `Cloud Build` や `builds` に関する権限エラー | **手順 1** で Cloud Build Editor が付いているか確認する |
| `Artifact Registry` の権限エラー | **手順 1** で Artifact Registry Writer が付いているか確認する |
| `cloudscheduler` の権限エラー | **手順 1** で Cloud Scheduler Admin が付いているか、**手順 3** で Cloud Scheduler API が有効か確認する |
| API が有効でない / 見つからない | **手順 3** の 4 API をすべて有効化する |
