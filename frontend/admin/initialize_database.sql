-- Supabaseデータベースの完全初期化スクリプト
-- 管理者権限で実行する必要があります
-- Supabaseダッシュボードの「SQL Editor」で実行してください

--------------------------------------------------
-- 既存のテーブルの削除
--------------------------------------------------
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

--------------------------------------------------
-- auth.users のデータをクリア
--------------------------------------------------
DELETE FROM auth.users;
ALTER SEQUENCE IF EXISTS auth.users_id_seq RESTART WITH 1;

--------------------------------------------------
-- ユーザーテーブルの作成
--------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- インデックスの作成
CREATE INDEX users_email_idx ON public.users (email);

-- テーブルに対するコメントを追加
COMMENT ON TABLE public.users IS 'ユーザープロファイル情報を格納するテーブル';
COMMENT ON COLUMN public.users.id IS 'auth.usersテーブルの外部キー';
COMMENT ON COLUMN public.users.email IS 'ユーザーのメールアドレス';

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

--------------------------------------------------
-- プロジェクトテーブルの作成
--------------------------------------------------
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  scan_options JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  results JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX projects_user_id_idx ON public.projects (user_id);
CREATE INDEX projects_status_idx ON public.projects (status);

-- RLSポリシーの設定（Row Level Security）
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロジェクトのみ参照可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ参照可能" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのみ追加可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ追加可能" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのみ更新可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ更新可能" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのみ削除可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ削除可能" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- テーブルの公開設定
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated, service_role;

--------------------------------------------------
-- 自動更新トリガーの作成
--------------------------------------------------
-- 更新時間を自動的に設定するトリガー関数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- usersテーブルに更新時刻の自動更新トリガーを設定
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- projectsテーブルに更新時刻の自動更新トリガーを設定
CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

--------------------------------------------------
-- 初期化完了メッセージ
--------------------------------------------------
SELECT 'データベースが正常に初期化されました。テーブル: users, projects' AS message; 