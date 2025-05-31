-- 既存のテーブルと関連するポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "ユーザーは自分のデータのみ参照可能" ON public.users;
DROP POLICY IF EXISTS "認証されたユーザーは自分のデータを追加可能" ON public.users;
DROP POLICY IF EXISTS "認証されたユーザーは自分のデータを更新可能" ON public.users;
DROP POLICY IF EXISTS "認証されたユーザーは自分のデータを削除可能" ON public.users;
DROP POLICY IF EXISTS "すべてのユーザーが挿入可能" ON public.users;

DROP POLICY IF EXISTS "ユーザーは自分のプロジェクトのみ参照可能" ON public.projects;
DROP POLICY IF EXISTS "認証されたユーザーは自分のプロジェクトを追加可能" ON public.projects;
DROP POLICY IF EXISTS "認証されたユーザーは自分のプロジェクトを更新可能" ON public.projects;
DROP POLICY IF EXISTS "認証されたユーザーは自分のプロジェクトを削除可能" ON public.projects;

DROP FUNCTION IF EXISTS public.get_authenticated_user();
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.users;

-- usersテーブルを作成
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 一般公開ポリシー - 新規ユーザーの登録を許可するため
CREATE POLICY "すべてのユーザーが挿入可能" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- ユーザーが自分のデータのみ参照できるポリシー
CREATE POLICY "ユーザーは自分のデータのみ参照可能" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 認証されたユーザーが自分のデータを更新できるポリシー
CREATE POLICY "認証されたユーザーは自分のデータを更新可能" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 認証されたユーザーが自分のデータを削除できるポリシー
CREATE POLICY "認証されたユーザーは自分のデータを削除可能" ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- 認証されたユーザーのデータ参照用関数
CREATE OR REPLACE FUNCTION public.get_authenticated_user()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;

-- インデックスの作成
CREATE INDEX idx_users_email ON public.users(email);

-- テーブルコメントの追加
COMMENT ON TABLE public.users IS 'アプリケーションのユーザー情報を格納するテーブル';
COMMENT ON COLUMN public.users.id IS 'Supabase Authのユーザーと紐づくID';
COMMENT ON COLUMN public.users.email IS 'ユーザーのメールアドレス';
COMMENT ON COLUMN public.users.created_at IS 'ユーザーデータの作成日時';

-- プロジェクトテーブルを作成
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  options TEXT[] NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- RLSを有効化
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のプロジェクトのみ参照できるポリシー
CREATE POLICY "ユーザーは自分のプロジェクトのみ参照可能" ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- 認証されたユーザーが自分のプロジェクトを追加できるポリシー
CREATE POLICY "認証されたユーザーは自分のプロジェクトを追加可能" ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 認証されたユーザーが自分のプロジェクトを更新できるポリシー
CREATE POLICY "認証されたユーザーは自分のプロジェクトを更新可能" ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 認証されたユーザーが自分のプロジェクトを削除できるポリシー
CREATE POLICY "認証されたユーザーは自分のプロジェクトを削除可能" ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- テーブルコメントの追加
COMMENT ON TABLE public.projects IS 'スキャンプロジェクト情報を格納するテーブル';
COMMENT ON COLUMN public.projects.id IS 'プロジェクトの一意の識別子';
COMMENT ON COLUMN public.projects.name IS 'プロジェクト名';
COMMENT ON COLUMN public.projects.target_url IS 'スキャン対象のURL';
COMMENT ON COLUMN public.projects.scan_type IS 'スキャンタイプ（quick, full, custom）';
COMMENT ON COLUMN public.projects.options IS '選択されたスキャンオプションの配列';
COMMENT ON COLUMN public.projects.status IS 'プロジェクトのステータス（running, completed, cancelled）';
COMMENT ON COLUMN public.projects.progress IS 'スキャンの進捗（0-100）';
COMMENT ON COLUMN public.projects.user_id IS 'プロジェクト所有者のユーザーID';
COMMENT ON COLUMN public.projects.created_at IS 'プロジェクトの作成日時';
COMMENT ON COLUMN public.projects.updated_at IS 'プロジェクトの最終更新日時';
COMMENT ON COLUMN public.projects.completed_at IS 'プロジェクトの完了日時'; 