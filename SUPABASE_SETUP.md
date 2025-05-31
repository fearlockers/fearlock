# Supabase プロジェクトの初期化と設定手順

## 1. 新しいSupabaseプロジェクトを作成

1. [Supabase ダッシュボード](https://app.supabase.io/) にログイン
2. 「New Project」ボタンをクリック
3. 以下の情報を入力：
   - Name: `fearlock`（任意の名前）
   - Database Password: 安全なパスワードを設定
   - Region: 最寄りのリージョンを選択
4. 「Create new project」をクリック

## 2. テーブルとRLSポリシーを設定

1. プロジェクトが作成されたら、「SQL Editor」を開く
2. 以下のSQLを実行して必要なテーブルとポリシーを作成：

```sql
-- usersテーブルを作成
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のデータのみ参照できるポリシー
CREATE POLICY "ユーザーは自分のデータのみ参照可能" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 認証されたユーザーが自分のデータを追加できるポリシー
CREATE POLICY "認証されたユーザーは自分のデータを追加可能" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 認証されたユーザーが自分のデータを更新できるポリシー
CREATE POLICY "認証されたユーザーは自分のデータを更新可能" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 認証されたユーザーのデータ参照用関数
CREATE OR REPLACE FUNCTION public.get_authenticated_user()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;
```

## 3. 認証設定の確認

1. 左側のメニューから「Authentication」を選択
2. 「Settings」タブをクリック
3. 「Email Auth」が有効になっていることを確認
4. 「Redirect URLs」に `http://localhost:5000` と `https://fearlockers.github.io/fearlock` を追加
5. 「Save」をクリック

## 4. APIキーの取得

1. 左側のメニューから「Project Settings」を選択
2. 「API」タブをクリック
3. 「Project URL」と「anon/public」キーをコピー

## 5. アプリケーションの設定を更新

1. `frontend/config.js` ファイルを開く
2. Supabase URLとAPIキーを新しいプロジェクトの値に更新：

```js
const config = {
  // 本番環境用の設定（GitHub Pages）
  production: {
    supabaseUrl: '新しいプロジェクトURL',
    supabaseKey: '新しいAPIキー',
    apiUrl: 'https://fearlockers.github.io/fearlock/api'
  },
  // 開発環境用の設定
  development: {
    supabaseUrl: '新しいプロジェクトURL',
    supabaseKey: '新しいAPIキー',
    apiUrl: 'http://localhost:5000/api'
  }
};
```

## 6. ローカルでのテスト

1. 変更したファイルをコミットしてGitHubにプッシュ
2. ローカル環境で動作確認
   ```
   cd frontend
   python -m http.server
   ```

## 7. デバッグ方法

問題が発生した場合：
1. ブラウザの開発者ツールを開いてコンソールエラーを確認
2. Supabaseダッシュボードの「Authentication」>「Users」でユーザー登録状況を確認
3. RLSポリシーが正しく設定されているか確認 