# Fearlock

フロントエンドとバックエンドを持つウェブアプリケーションで、Supabaseを使用してユーザー認証とデータストレージを管理します。

## 技術スタック

- フロントエンド: HTML, CSS, JavaScript
- バックエンド: Python, Flask
- データベース: Supabase
- デプロイ: Cloudflare Pages (フロントエンド), Cloudflare Workers (バックエンド)

## 開発環境のセットアップ

### 前提条件

- Node.js (v14以上)
- Python (v3.8以上)
- Supabaseアカウント

### インストール手順

1. リポジトリをクローン
```
git clone https://github.com/fearlockers/fearlock.git
cd fearlock
```

2. バックエンドの依存関係をインストール
```
pip install -r requirements.txt
```

3. Supabaseプロジェクトをセットアップ
   - Supabaseダッシュボードで新しいプロジェクトを作成
   - `supabase_setup.sql`の内容を実行して必要なテーブルとポリシーを設定

4. 環境変数の設定
   - `.env.example`をコピーして`.env`を作成
   - Supabaseの認証情報を設定

5. アプリケーションの実行
```
# バックエンド
cd backend
python app.py

# フロントエンド（別ターミナルで）
cd frontend
# 静的ファイルを表示するシンプルなサーバーを使用
python -m http.server
```

## デプロイ

### Cloudflare Pagesを使用したフロントエンドのデプロイ

1. GitHubリポジトリと連携
2. ビルド設定: なし（静的サイト）
3. 環境変数: Supabase URLとAPIキー

### Cloudflare Workersを使用したバックエンドのデプロイ

1. Worker用のコードを作成
2. Cloudflare Dashboardからデプロイ
3. 環境変数として機密情報を設定
