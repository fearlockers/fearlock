-- Supabaseデータベースのリセットスクリプト
-- 管理者権限で実行する必要があります

-- 既存のテーブルが存在する場合は削除
DROP TABLE IF EXISTS public.users CASCADE;

-- ユーザーテーブルの作成
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLSポリシーの設定（Row Level Security）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーのみが自分のデータを参照できるポリシー
CREATE POLICY "ユーザーは自分のデータを参照可能" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 認証されたユーザーのみが自分のデータを更新できるポリシー
CREATE POLICY "ユーザーは自分のデータを更新可能" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 新規ユーザー作成は誰でも可能（サインアップ時に使用）
CREATE POLICY "新規ユーザーの作成は誰でも可能" ON public.users
  FOR INSERT WITH CHECK (true);

-- テーブルの公開設定
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated, service_role;

-- auth.usersのすべてのデータをクリア（管理者のみが実行可能）
-- 注意: 本番環境では実行前に確認してください
DELETE FROM auth.users;

-- シーケンスをリセット
ALTER SEQUENCE IF EXISTS auth.users_id_seq RESTART WITH 1;

-- テーブルに対するコメントを追加
COMMENT ON TABLE public.users IS 'ユーザープロファイル情報を格納するテーブル';
COMMENT ON COLUMN public.users.id IS 'auth.usersテーブルの外部キー';
COMMENT ON COLUMN public.users.email IS 'ユーザーのメールアドレス';

-- インデックスを作成
CREATE INDEX users_email_idx ON public.users (email);

-- テーブル作成の確認メッセージ
SELECT 'データベースが正常に初期化され、新しいテーブルが作成されました。' AS message; 