# Firebase Functions デプロイの権限設定

GitHub Actions で Firebase Functions のデプロイが失敗する場合、サービスアカウントに以下の IAM ロールを追加してください。

## 1. プロジェクトのロール付与

1. [Google Cloud Console - IAM](https://console.cloud.google.com/iam-admin/iam?project=moodlog-6297c) を開く
2. GitHub シークレット `FIREBASE_SERVICE_ACCOUNT_MOODLOG_6297C` に登録しているサービスアカウントのメールを確認（JSON の `client_email` フィールド）
3. そのサービスアカウントに以下のロールを追加：
   - **Cloud Functions Developer**
   - **Cloud Scheduler Admin**（スケジュール関数用）
   - **Service Account User**
   - **Firebase Extensions Viewer**
   - **Cloud Build Editor**（Firebase Functions v2 のビルド用）
   - **Artifact Registry Writer**（コンテナイメージのプッシュ用）

## gcloud コマンドで一括付与

```bash
PROJECT_ID="moodlog-6297c"
SA_EMAIL="あなたのサービスアカウントのメールアドレス"

for ROLE in roles/cloudfunctions.developer roles/cloudscheduler.admin roles/iam.serviceAccountUser roles/firebaseextensions.viewer roles/cloudbuild.builds.editor roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet
done
```

## 2. デフォルト Compute サービスアカウントへの権限（必須）

`iam.serviceAccounts.ActAs` エラーを防ぐため、デプロイ用サービスアカウントに App Engine デフォルト SA の「使用」権限を付与：

```bash
PROJECT_ID="moodlog-6297c"
SA_EMAIL="あなたのデプロイ用サービスアカウントのメール"
DEFAULT_SA="${PROJECT_ID}@appspot.gserviceaccount.com"

gcloud iam service-accounts add-iam-policy-binding $DEFAULT_SA \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --project=$PROJECT_ID
```

## 3. 必要な API の有効化

次の API が有効か確認してください：
- [Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=moodlog-6297c)
- [Cloud Scheduler API](https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?project=moodlog-6297c)
- [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=moodlog-6297c)
- [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=moodlog-6297c)
