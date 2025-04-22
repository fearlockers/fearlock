# デプロイ手順

## 前提条件

- GitHubアカウント
- Cloudflareアカウント
- Supabaseアカウント
- Wranglerがインストールされていること（Cloudflare Workersのデプロイツール）

## 1. Supabaseのセットアップ

1. Supabaseダッシュボードで新しいプロジェクトを作成します
2. SQLエディタを開き、`supabase_setup.sql`の内容を実行します
3. API URLとAPI Keyを記録しておきます

## 2. GitHubリポジトリのセットアップ

1. GitHubで新しいリポジトリを作成します
2. 以下のコマンドでローカルからリポジトリにプッシュします:

```bash
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/yourusername/fearlock.git
git push -u origin main
```

## 3. Cloudflare Pagesのセットアップ

1. Cloudflareダッシュボードにログインします
2. Workers & Pagesセクションに移動し、「新しいアプリケーションを作成」を選択します
3. GitHubリポジトリを接続します
4. 以下の設定で構成します:
   - フレームワークプリセット: None
   - ビルドコマンド: なし（静的サイト）
   - ビルド出力ディレクトリ: frontend
   - ルートディレクトリ: /
   - 環境変数: 必要に応じて設定

## 4. Cloudflare Workersのセットアップ

1. Wranglerをインストールします:

```bash
npm install -g wrangler
```

2. Wranglerでログインします:

```bash
wrangler login
```

3. プロジェクトディレクトリに移動します:

```bash
cd path/to/fearlock
```

4. シークレット情報を設定します:

```bash
wrangler secret put SUPABASE_URL
# プロンプトが表示されたらSupabase URLを入力

wrangler secret put SUPABASE_KEY
# プロンプトが表示されたらSupabase API Keyを入力
```

5. Workerをデプロイします:

```bash
wrangler deploy
```

## 5. フロントエンドとバックエンドの連携

1. フロントエンドの設定ファイル `frontend/_redirects` を編集し、WorkerのURLを正しいものに更新します
2. 変更をGitHubにプッシュします:

```bash
git add .
git commit -m "Workerのエンドポイントを更新"
git push
```

3. Cloudflare Pagesが自動的に新しいバージョンをデプロイします

## 6. 動作確認

1. Cloudflare Pagesのデプロイ完了後に提供されるURLにアクセスします
2. ログインや新規登録が正常に機能することを確認します

## トラブルシューティング

### CORSエラー
- Workerのコードで正しいCORS設定がされていることを確認します
- Cloudflare Pagesの設定で適切なCSPヘッダーが設定されていることを確認します

### 認証エラー
- Supabaseの認証設定を確認します
- 環境変数が正しく設定されていることを確認します 