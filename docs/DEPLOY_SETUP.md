# Firebase Functions デプロイの権限設定

GitHub Actions で Firebase Functions のデプロイが失敗する場合、サービスアカウントに以下の IAM ロールを追加してください。

## 手順

1. [Google Cloud Console - IAM](https://console.cloud.google.com/iam-admin/iam?project=moodlog-6297c) を開く
2. GitHub シークレット `FIREBASE_SERVICE_ACCOUNT_MOODLOG_6297C` に登録しているサービスアカウントのメールを確認
3. そのサービスアカウントに以下のロールを追加：
   - **Cloud Functions Developer**
   - **Cloud Scheduler Admin**（スケジュール関数用）
   - **Service Account User**
   - **Firebase Extensions Viewer**

## gcloud コマンドで一括付与

サービスアカウントのメールを `SA_EMAIL` に置き換えて実行：

```bash
PROJECT_ID="moodlog-6297c"
SA_EMAIL="あなたのサービスアカウントのメールアドレス"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/firebaseextensions.viewer"
```

## デフォルト Compute サービスアカウントへの権限

`iam.serviceAccounts.ActAs` エラーが出る場合、デフォルトの App Engine サービスアカウントに「このサービスアカウントを使用」権限を付与：

```bash
PROJECT_ID="moodlog-6297c"
SA_EMAIL="あなたのデプロイ用サービスアカウントのメール"
DEFAULT_SA="${PROJECT_ID}@appspot.gserviceaccount.com"

gcloud iam service-accounts add-iam-policy-binding $DEFAULT_SA \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --project=$PROJECT_ID
```
